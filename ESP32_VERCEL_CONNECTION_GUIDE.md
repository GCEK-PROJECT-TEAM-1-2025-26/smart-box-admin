# ESP32 Vercel Connection Troubleshooting

## Issue

ESP32 getting SSL/connection errors even though Vercel certificates are valid:

```
[E][WiFiClientSecure.cpp:144] connect(): start_ssl_client: -1
HTTP POST failed: connection refused
HTTP GET failed: connection refused
```

## Root Causes

### 1. DNS Resolution Failure

ESP32 cannot resolve `smart-box-admin.vercel.app` domain name

**Solution**: Configure public DNS servers

```cpp
WiFi.setDNS(8, 8, 8, 8);  // Google DNS
WiFi.setDNS(1, 1, 1, 1);  // Cloudflare DNS
```

### 2. SSL Certificate Issue

ESP32 can't validate Vercel's SSL certificate

**Solution**: Skip certificate validation for testing

```cpp
client.setInsecure(); // Disable certificate validation
```

### 3. Network Connectivity

ESP32 WiFi connected but no internet access

**Solution**: Test connectivity with HTTP request to public URL

## Testing Steps

### Step 1: Verify WiFi Connection

Check serial output:

```
Connecting to WiFi: SREEHARI
...........................
WiFi connected
IP address: 192.168.x.x
```

### Step 2: Test with insecure connection (temporary)

Update the GET function:

```cpp
WiFiClientSecure client;
client.setInsecure(); // TEMPORARY: Disable SSL verification
client.setCACert(nullptr);
```

### Step 3: Test with HTTP first

If you have a local HTTP endpoint, test with:

```cpp
const char *BACKEND_BASE_URL = "http://192.168.x.x:3000";
HTTPClient http;
http.begin(url); // No WiFiClientSecure needed
```

### Step 4: Check Vercel Backend

Verify your Vercel app is running:

```bash
# Test the endpoint manually
curl -X GET "https://smart-box-admin.vercel.app/api/esp/next-command?deviceId=box_001" \
  -H "X-DEVICE-ID: box_001" \
  -H "X-DEVICE-SECRET: super-secret-token" \
  -v
```

## Quick Fix: Disable SSL Verification (Development Only)

In `fetchNextCommand()`:

```cpp
WiFiClientSecure client;
client.setInsecure(); // Add this line
client.setCACert(nullptr);
client.setConnectTimeout(10000);
```

In `sendStatus()`:

```cpp
WiFiClientSecure client;
client.setInsecure(); // Add this line
client.setCACert(nullptr);
client.setConnectTimeout(10000);
```

## Serial Debug Output to Check

After recompiling, you should see:

```
WiFi connected
IP address: 192.168.29.xxx
GET https://smart-box-admin.vercel.app/api/esp/next-command?deviceId=box_001&lastCommandId=
HTTP GET code: 200
Command payload: {...}
```

## Network Debugging Commands (ESP32 Serial)

Add this function to test connectivity:

```cpp
void testConnection() {
    Serial.println("\n=== Testing Connection ===");
    Serial.print("WiFi Status: ");
    Serial.println(WiFi.status());

    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    Serial.print("DNS 1: ");
    Serial.println(WiFi.dnsIP(0));

    Serial.print("DNS 2: ");
    Serial.println(WiFi.dnsIP(1));

    Serial.println("=== End Test ===\n");
}
```

Call it in setup():

```cpp
void setup() {
    // ... existing code ...
    connectWiFi();
    testConnection(); // Add this
    // ... rest of setup ...
}
```

## Common Issues & Solutions

| Issue                  | Cause                             | Solution                        |
| ---------------------- | --------------------------------- | ------------------------------- |
| `connection refused`   | DNS can't resolve domain          | Set Google/Cloudflare DNS       |
| `SSL handshake failed` | Certificate validation fails      | Use `setInsecure()` for testing |
| `timeout`              | No internet access                | Check WiFi internet access      |
| `404 Not Found`        | Endpoint doesn't exist on backend | Verify endpoint path            |
| `401 Unauthorized`     | Wrong credentials                 | Check X-DEVICE-SECRET matches   |

## Production Checklist

- [ ] WiFi connected and has internet
- [ ] DNS servers configured (Google 8.8.8.8)
- [ ] Vercel app deployed and responding
- [ ] Backend endpoints accessible via curl
- [ ] Device credentials correct (box_001, super-secret-token)
- [ ] SSL verification working (not using setInsecure)
- [ ] 10-second timeout sufficient for Vercel cold start

## Next: Enable SSL Verification Properly

Once basic connectivity works, use proper SSL verification:

```cpp
WiFiClientSecure client;
// Option 1: Use system CA bundle (requires proper device certificates)
client.setCACert(nullptr);

// Option 2: Use Vercel's certificate directly
const char* ca_cert = R"EOF(
-----BEGIN CERTIFICATE-----
[Vercel CA Certificate]
-----END CERTIFICATE-----
)EOF";
client.setCACert(ca_cert);
```

## Still Not Working?

1. Try with `http://` instead of `https://` on local IP
2. Check Vercel logs: https://vercel.com/dashboard
3. Verify backend environment variables are set
4. Test backend endpoint with Postman
5. Check Firebase rules allow ESP32 access
