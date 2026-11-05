fn main() {
    println!("cargo:rerun-if-changed=../.tauri-dist");
    tauri_build::build()
}
