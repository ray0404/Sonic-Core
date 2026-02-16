const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.option([]const u8, "target", "Target triple (e.g., x86_64-windows-gnu, aarch64-macos)") orelse b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // --- Options ---
    const plugin_name = b.option([]const u8, "plugin-name", "Name of the plugin to build") orelse "Gain";
    
    // --- Modules ---
    // Construct path to plugin source
    var buffer: [64]u8 = undefined;
    if (plugin_name.len > buffer.len) @panic("Plugin name too long");
    // lowerString copies content to buffer
    const lower_name = std.ascii.lowerString(buffer[0..plugin_name.len], plugin_name);
    
    const plugin_path_str = b.fmt("plugins/{s}.zig", .{lower_name});
    const plugin_path = b.path(plugin_path_str);

    const plugin_mod = b.createModule(.{
        .root_source_file = plugin_path,
    });

    // --- Static Library (Zig DSP Kernel) ---
    // This compiles the Zig code into a static lib that C++ can link against.
    const lib = b.addStaticLibrary(.{
        .name = "dsp_kernel",
        .root_source_file = b.path("c_export.zig"),
        .target = target,
        .optimize = optimize,
    });
    lib.root_module.addImport("plugin_impl", plugin_mod);
    
    const lib_install = b.addInstallArtifact(lib, .{});
    
    // --- VST3 Shared Library (Native Wrapper) ---
    const vst3_lib = b.addSharedLibrary(.{
        .name = plugin_name,
        .target = target,
        .optimize = optimize,
    });
    
    vst3_lib.addCSourceFile(.{
        .file = b.path("native/PluginWrapper.cpp"),
        .flags = &.{ "-std=c++17", "-fPIC" },
    });
    
    vst3_lib.linkLibrary(lib);
    vst3_lib.addIncludePath(b.path("native"));
    
    const vst3_install = b.addInstallArtifact(vst3_lib, .{});

    // Install step
    const plugin_step = b.step("plugin", "Build the VST3 plugin");
    plugin_step.dependOn(&lib_install.step);
    plugin_step.dependOn(&vst3_install.step);

    // --- AU Shared Library (Native Wrapper) ---
    const au_lib = b.addSharedLibrary(.{
        .name = plugin_name, // Result: lib{name}.dylib
        .target = target,
        .optimize = optimize,
    });

    au_lib.addCSourceFile(.{
        .file = b.path("native/AUWrapper.cpp"),
        .flags = &.{ "-std=c++17", "-fPIC" },
    });

    au_lib.linkLibrary(lib);
    au_lib.addIncludePath(b.path("native"));

    const au_install = b.addInstallArtifact(au_lib, .{});

    // --- AU Bundle Step ---
    const au_step = b.step("au", "Build the Audio Unit plugin bundle");
    au_step.dependOn(&lib_install.step);
    au_step.dependOn(&au_install.step);

    // Define Bundle Structure
    const bundle_dir = b.fmt("{s}.component", .{plugin_name});
    const contents_dir = b.fmt("{s}/Contents", .{bundle_dir});
    const macos_dir = b.fmt("{s}/MacOS", .{contents_dir});
    const plist_path = b.fmt("{s}/Info.plist", .{contents_dir});

    // 1. Create Directories
    const mkdir_cmd = b.addSystemCommand(&.{ "mkdir", "-p", macos_dir });
    au_step.dependOn(&mkdir_cmd.step);

    // 2. Copy Library
    // Note: Assuming macOS (.dylib).
    const src_lib_name = b.fmt("zig-out/lib/lib{s}.dylib", .{plugin_name});
    // AU binary usually matches the plugin name
    const dst_bin_path = b.fmt("{s}/{s}", .{macos_dir, plugin_name});
    
    const cp_lib_cmd = b.addSystemCommand(&.{ "sh", "-c", b.fmt("cp \"{s}\" \"{s}\"", .{src_lib_name, dst_bin_path}) });
    cp_lib_cmd.step.dependOn(&au_install.step);
    cp_lib_cmd.step.dependOn(&mkdir_cmd.step);
    au_step.dependOn(&cp_lib_cmd.step);

    // 3. Copy Info.plist.template
    const cp_plist_cmd = b.addSystemCommand(&.{ "cp", "native/Info.plist.template", plist_path });
    cp_plist_cmd.step.dependOn(&mkdir_cmd.step);
    au_step.dependOn(&cp_plist_cmd.step);

    // 4. Update Info.plist
    // Use .bak for BSD sed compatibility (macOS)
    const sed_name_cmd = b.addSystemCommand(&.{ "sh", "-c", b.fmt("sed -i.bak 's/{{PLUGIN_NAME}}/{s}/g' \"{s}\"", .{plugin_name, plist_path}) });
    sed_name_cmd.step.dependOn(&cp_plist_cmd.step);
    au_step.dependOn(&sed_name_cmd.step);

    const sed_bin_cmd = b.addSystemCommand(&.{ "sh", "-c", b.fmt("sed -i.bak 's/{{BINARY_NAME}}/{s}/g' \"{s}\"", .{plugin_name, plist_path}) });
    sed_bin_cmd.step.dependOn(&sed_name_cmd.step);
    au_step.dependOn(&sed_bin_cmd.step);

    // 5. Cleanup .bak
    const rm_bak_cmd = b.addSystemCommand(&.{ "rm", b.fmt("{s}.bak", .{plist_path}) });
    rm_bak_cmd.step.dependOn(&sed_bin_cmd.step);
    au_step.dependOn(&rm_bak_cmd.step);

    // 6. Codesign (Ad-hoc)
    const sign_cmd = b.addSystemCommand(&.{ "codesign", "--force", "--deep", "-s", "-", bundle_dir });
    sign_cmd.step.dependOn(&rm_bak_cmd.step);
    au_step.dependOn(&sign_cmd.step);

    // 7. Move to dist
    const dist_plugins = "../../dist/plugins";
    const mkdir_dist_cmd = b.addSystemCommand(&.{ "mkdir", "-p", dist_plugins });
    const mv_cmd = b.addSystemCommand(&.{ "cp", "-r", bundle_dir, dist_plugins });
    mv_cmd.step.dependOn(&sign_cmd.step);
    mv_cmd.step.dependOn(&mkdir_dist_cmd.step);
    au_step.dependOn(&mv_cmd.step);
}
