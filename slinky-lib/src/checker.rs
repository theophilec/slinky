use reqwest::blocking::Client;

#[derive(Debug, PartialEq)]
pub enum CheckResult {
    Pass,
    Fail,
    Unknown,
}

pub fn check_link(url: &str, client: &Client) -> CheckResult {
    let response = client.get(url).send();

    match response {
        Ok(response) => {
            if response.status().is_success() {
                CheckResult::Pass
            } else {
                println!("Failed to fetch URL: {}", response.status());
                CheckResult::Fail
            }
        }
        Err(_) => CheckResult::Unknown,
    }
}

#[test]
fn test_check_link_pass() {
    let client = Client::new();
    let result_1 = check_link("https://www.example.com", &client);
    let result_2 = check_link("https://www.example.com", &client);
    assert_eq!(result_2, CheckResult::Pass);
    assert_eq!(result_1, CheckResult::Pass);
}

#[test]
fn test_check_link_fail() {
    let client = Client::new();
    let result = check_link("https://www.exampl239048230894e.com", &client);
    assert_eq!(result, CheckResult::Fail);
}

// #[test]
// fn test_check_link_unknown() {
//     let result = check_link("https://www.linkedin.com");
//     assert_eq!(result, CheckResult::Unknown);
// }
