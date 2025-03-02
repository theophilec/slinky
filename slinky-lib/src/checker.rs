use reqwest::{blocking::Client, StatusCode};

#[derive(Debug, PartialEq)]
pub enum CheckResult {
    Pass,
    Fail,
}

pub fn check_link(url: &str, client: &Client) -> CheckResult {
    client
        .get(url)
        .send()
        .map_or(CheckResult::Fail, |r| match r.status() {
            StatusCode::OK => CheckResult::Pass,
            StatusCode::NOT_FOUND => CheckResult::Fail,
            _ => CheckResult::Fail,
        })
}

fn get_check_link(url: &str, client: &Client) -> (CheckResult, Option<String>) {
    client
        .get(url)
        .send()
        .map_or((CheckResult::Fail, None), |r| match r.status() {
            StatusCode::OK => (CheckResult::Pass, r.text().map_or(None, |text| Some(text))),
            StatusCode::NOT_FOUND => (CheckResult::Fail, None),
            _ => (CheckResult::Fail, None),
        })
}

pub fn check_link_content(url: &str, client: &Client, required_text: &str) -> CheckResult {
    let (result, content) = get_check_link(url, client);
    match (result, content) {
        (CheckResult::Fail, _) => CheckResult::Fail,
        (CheckResult::Pass, None) => CheckResult::Pass,
        (CheckResult::Pass, Some(content)) => {
            if content.contains(required_text) {
                CheckResult::Pass
            } else {
                CheckResult::Fail
            }
        }
    }
}

pub fn not_check_link_content(url: &str, client: &Client, required_text: &str) -> CheckResult {
    let (result, content) = get_check_link(url, client);
    match (result, content) {
        (CheckResult::Fail, _) => CheckResult::Fail,
        (CheckResult::Pass, None) => CheckResult::Pass,
        (CheckResult::Pass, Some(content)) => {
            if content.contains(required_text) {
                CheckResult::Fail
            } else {
                CheckResult::Pass
            }
        }
    }
}

#[test]
fn test_check_link_pass() {
    let client = Client::new();
    let result_1 = check_link("https://www.example.com", &client);
    assert_eq!(result_1, CheckResult::Pass);
}

#[test]
fn test_check_link_fail() {
    let client = Client::new();
    let result_1 = check_link("https://www.exampl239048230894e.com", &client);
    assert_eq!(result_1, CheckResult::Fail);
}
