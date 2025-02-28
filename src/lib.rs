use std::collections::HashSet;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::HtmlAnchorElement;
use web_sys::HtmlCollection;

#[wasm_bindgen]
pub fn gather_links(required_links: Option<String>, excluded_links: Option<String>) -> String {
    let link_targets = collect_links_from_window();
    let link_targets_map = HashSet::from_iter(link_targets.iter().map(|x| x.as_str()));

    let collected_required_links = required_links
        .as_ref()
        .map_or_else(|| HashSet::new(), |x| x.split(',').collect());

    let collected_excluded_links = excluded_links
        .as_ref()
        .map_or_else(|| HashSet::new(), |x| x.split(',').collect());

    let (filtered_links, missing_links) = check_links(
        link_targets_map,
        collected_required_links,
        collected_excluded_links,
    );
    render_results(filtered_links, missing_links)
}

fn collect_links_from_window() -> Vec<String> {
    let window = web_sys::window().expect("no global `window` exists");
    let document = window.document().expect("should have a document on window");
    let links: HtmlCollection = document.get_elements_by_tag_name("a");
    let mut link_targets = Vec::new();

    for i in 0..links.length() {
        if let Some(link) = links.item(i) {
            if let Some(anchor) = link.dyn_ref::<HtmlAnchorElement>() {
                // ignore None case in Options in item and dyn_ref
                link_targets.push(anchor.href());
            }
        }
    }

    link_targets
}

fn check_links<'a>(
    collected_links: HashSet<&'a str>,
    required_links: HashSet<&'a str>,
    excluded_links: HashSet<&'a str>,
) -> (HashSet<&'a str>, HashSet<&'a str>) {
    let filtered_links = collected_links
        .difference(&excluded_links)
        .map(|x| *x)
        .collect();
    let missing_links = required_links
        .difference(&filtered_links)
        .map(|x| *x)
        .collect();

    (filtered_links, missing_links)
}

fn render_results(links_present: HashSet<&str>, missing_links: HashSet<&str>) -> String {
    let mut results = String::new();

    results.push_str("Links present:\n");
    for link in links_present {
        results.push_str(&format!("  {}\n", link));
    }

    results.push_str("Missing links:\n");
    for link in missing_links {
        results.push_str(&format!("  {}\n", link));
    }

    results
}
