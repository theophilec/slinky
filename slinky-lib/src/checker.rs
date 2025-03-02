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
