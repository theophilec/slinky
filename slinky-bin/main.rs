use reqwest;
use slinky_lib::checker;

fn main() {
    let client = reqwest::blocking::Client::new();
    let res = checker::check_link("https://example.com", &client);
    println!("{:?}", res);
}
