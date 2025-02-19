use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::HtmlAnchorElement;
use web_sys::HtmlCollection;

#[wasm_bindgen]
pub fn gather_links() -> Vec<String> {
    let window = web_sys::window().expect("no global `window` exists");
    let document = window.document().expect("should have a document on window");
    let links: HtmlCollection = document.get_elements_by_tag_name("a");
    let mut link_targets = Vec::new();
    let mut link_titles = Vec::new();

    for i in 0..links.length() {
        if let Some(link) = links.item(i) {
            if let Some(anchor) = link.dyn_ref::<HtmlAnchorElement>() {
                // ignore None case in Options in item and dyn_ref
                link_targets.push(anchor.href());
                link_titles.push(anchor.inner_text());
            }
        }
    }

    link_targets
}
