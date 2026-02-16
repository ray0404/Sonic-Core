import time
import subprocess
import os
import shutil
import sys

# Paths relative to script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
KERNEL_DIR = os.path.join(PROJECT_ROOT, "libs", "sonic-dsp-kernel")
DIST_DIR = os.path.join(PROJECT_ROOT, "dist", "vst3")

IS_MACOS = sys.platform == 'darwin'

def get_mtime(path):
    t = 0
    for root, dirs, files in os.walk(path):
        if "zig-out" in root or "zig-cache" in root or ".component" in root:
            continue
        for f in files:
            if f.endswith(".zig") or f.endswith(".cpp") or f.endswith(".h") or f.endswith(".template"):
                p = os.path.join(root, f)
                t = max(t, os.path.getmtime(p))
    return t

def build_vst3(plugin_name="Gain"):
    cmd = ["zig", "build", "plugin", f"-Dname={plugin_name}"]
    print(f"Building VST3 {plugin_name}...")
    res = subprocess.run(cmd, cwd=KERNEL_DIR)
    if res.returncode != 0:
        print("VST3 Build failed.")
        return False
    
    # Deploy VST3
    out_lib_dir = os.path.join(KERNEL_DIR, "zig-out", "lib")
    found = False
    if os.path.exists(out_lib_dir):
        for f in os.listdir(out_lib_dir):
            if (f.startswith(f"lib{plugin_name}") or f.startswith(plugin_name)) and (f.endswith(".so") or f.endswith(".dll") or f.endswith(".dylib")):
                src = os.path.join(out_lib_dir, f)
                dst = os.path.join(DIST_DIR, f)
                try:
                    shutil.copy2(src, dst)
                    print(f"Deployed VST3 artifact {f} to {DIST_DIR}")
                    found = True
                except Exception as e:
                    print(f"Error deploying VST3: {e}")
    if not found:
        print("VST3 Artifact not found in zig-out/lib")
    return found

def build_au(plugin_name="Gain"):
    if not IS_MACOS:
        return True
        
    cmd = ["zig", "build", "au", f"-Dname={plugin_name}"]
    print(f"Building AU {plugin_name}...")
    res = subprocess.run(cmd, cwd=KERNEL_DIR)
    if res.returncode != 0:
        print("AU Build failed.")
        return False

    # Deploy AU
    src_component = os.path.join(KERNEL_DIR, f"{plugin_name}.component")
    user_home = os.path.expanduser("~")
    au_dir = os.path.join(user_home, "Library", "Audio", "Plug-Ins", "Components")
    
    if os.path.exists(src_component):
        try:
            if not os.path.exists(au_dir):
                os.makedirs(au_dir)
            
            dst = os.path.join(au_dir, f"{plugin_name}.component")
            if os.path.exists(dst):
                shutil.rmtree(dst)
            
            shutil.copytree(src_component, dst)
            print(f"Deployed AU to {dst}")
            return True
        except Exception as e:
            print(f"Error deploying AU: {e}")
            return False
    else:
        print(f"AU Bundle not found at {src_component}")
        return False

def main():
    print(f"Watching {KERNEL_DIR}...")
    if not os.path.exists(KERNEL_DIR):
        print(f"Error: Directory {KERNEL_DIR} not found.")
        return

    last_mtime = get_mtime(KERNEL_DIR)
    
    if not os.path.exists(DIST_DIR):
        os.makedirs(DIST_DIR)

    print(f"Platform: {sys.platform}")
    if IS_MACOS:
        print("macOS detected: AU build enabled.")

    print("Ready. Change a file to build.")

    try:
        while True:
            time.sleep(2)
            current_mtime = get_mtime(KERNEL_DIR)
            if current_mtime > last_mtime:
                print("Change detected. Building...")
                last_mtime = current_mtime
                
                # Build default plugin "Gain"
                plugin_name = "Gain"
                
                build_vst3(plugin_name)
                
                if IS_MACOS:
                    build_au(plugin_name)
                    
    except KeyboardInterrupt:
        print("Stopping.")

if __name__ == "__main__":
    main()
