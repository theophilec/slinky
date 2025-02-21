use std::collections::HashSet;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::HtmlAnchorElement;
use web_sys::HtmlCollection;

#[wasm_bindgen]
pub fn gather_links(required_links: Option<String>, excluded_links: Option<String>) -> String {
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
    let link_targets_map: HashSet<String> = link_targets.into_iter().collect();

    let collected_required_links: Option<HashSet<String>>;
    if let Some(required_links) = required_links {
        if required_links.is_empty() {
            collected_required_links = None;
        } else {
            collected_required_links =
                Some(required_links.split(',').map(|s| s.to_string()).collect());
        }
    } else {
        collected_required_links = None;
    }
    let collected_excluded_links: Option<HashSet<String>>;
    if let Some(excluded_links) = excluded_links {
        if excluded_links.is_empty() {
            collected_excluded_links = None;
        } else {
            collected_excluded_links =
                Some(excluded_links.split(',').map(|s| s.to_string()).collect());
        }
    } else {
        collected_excluded_links = None;
    }
    let (filtered_links, missing_links) = check_links(
        link_targets_map,
        collected_required_links,
        collected_excluded_links,
    );
    render_results(filtered_links, missing_links)
}

fn check_links(
    collected_links: HashSet<String>,
    required_links: Option<HashSet<String>>,
    excluded_links: Option<HashSet<String>>,
) -> (HashSet<String>, Option<HashSet<String>>) {
    let filtered_links: HashSet<String>;
    if let Some(excluded_links) = excluded_links {
        filtered_links = collected_links
            .difference(&excluded_links)
            .map(|x| x.to_string())
            .collect();
    } else {
        filtered_links = collected_links;
    }

    let missing_links: Option<HashSet<String>>;
    if let Some(required_links) = required_links {
        missing_links = Some(
            required_links
                .difference(&filtered_links)
                .map(|x| x.to_string())
                .collect(),
        );
    } else {
        missing_links = None;
    }

    (filtered_links, missing_links)
}

fn render_results(
    links_present: HashSet<String>,
    missing_links: Option<HashSet<String>>,
) -> String {
    let mut results = String::new();

    results.push_str("Links present:\n");
    for link in links_present {
        results.push_str(&format!("  {}\n", link));
    }
    if let Some(missing_links) = missing_links {
        results.push_str("Missing links:\n");
        for link in missing_links {
            results.push_str(&format!("  {}\n", link));
        }
    }

    results
}
