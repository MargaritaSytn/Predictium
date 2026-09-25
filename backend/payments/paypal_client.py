import base64
import time
import requests
from django.conf import settings


class PayPalAPIError(Exception):
    def __init__(self, status_code, body):
        self.status_code = status_code
        self.body = body
        super().__init__(f"PayPal API {status_code}: {body}")


_BASE_URLS = {
    "sandbox": "https://api-m.sandbox.paypal.com",
    "live": "https://api-m.paypal.com",
}

_token_cache = {"value": None, "expires_at": 0.0}


def _base_url():
    return _BASE_URLS[settings.PAYPAL_MODE]


def get_access_token():
    if _token_cache["value"] and _token_cache["expires_at"] - 30 > time.time():
        return _token_cache["value"]

    creds = f"{settings.PAYPAL_CLIENT_ID}:{settings.PAYPAL_CLIENT_SECRET}".encode()
    auth = base64.b64encode(creds).decode()
    r = requests.post(
        f"{_base_url()}/v1/oauth2/token",
        headers={
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data="grant_type=client_credentials",
        timeout=10,
    )
    if r.status_code != 200:
        raise PayPalAPIError(r.status_code, r.text)
    data = r.json()
    _token_cache["value"] = data["access_token"]
    _token_cache["expires_at"] = time.time() + data["expires_in"]
    return _token_cache["value"]


def paypal_request(method, path, json_body=None, expected=(200, 201)):
    token = get_access_token()
    r = requests.request(
        method,
        f"{_base_url()}{path}",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=json_body,
        timeout=15,
    )
    if r.status_code not in expected:
        try:
            body = r.json()
        except ValueError:
            body = r.text
        raise PayPalAPIError(r.status_code, body)
    return r.json() if r.content else {}
