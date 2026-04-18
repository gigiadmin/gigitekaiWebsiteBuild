# Advanced Network Troubleshooting Guide

**Category:** Network & Infrastructure | **Tier:** 2 | **Resolution Time:** 30-45 minutes | **Difficulty:** Advanced

## Overview

This guide covers advanced network troubleshooting for IT professionals and experienced users. It includes network diagnostics, TCP/IP configuration, DNS troubleshooting, and network performance optimization.

## Common Network Issues

| Issue | Symptom | Typical Cause |
|-------|---------|---------------|
| Intermittent Connectivity | Network drops and reconnects | Weak signal, interference, or driver issue |
| DNS Resolution Failure | Cannot access websites by name | DNS server issue or misconfiguration |
| Slow Network Speed | Network speed much slower than expected | Congestion, interference, or hardware issue |
| Cannot Access Specific Resources | Some websites/services unreachable | Firewall, routing, or DNS issue |
| IP Address Conflict | Multiple devices with same IP | DHCP misconfiguration or static IP conflict |
| Network Latency | High ping times or lag | Network congestion or routing issue |
| Packet Loss | Intermittent data loss | Network congestion or hardware failure |
| Cannot Connect to VPN | VPN connection fails | Port blocked, firewall, or authentication issue |

## Solution Steps

### Step 1: Perform Network Diagnostics

Diagnose network issues using command-line tools:

**For Windows:**

1. **Open Command Prompt** - Press Windows key + R → Type "cmd" → Press Enter
2. **Check IP configuration:**
   ```
   ipconfig /all
   ```
   - Note your IP address, subnet mask, gateway, and DNS servers
3. **Test connectivity to gateway:**
   ```
   ping [gateway-ip]
   ```
   - Should show replies with low latency
4. **Test DNS resolution:**
   ```
   nslookup google.com
   ```
   - Should resolve to IP address
5. **Test internet connectivity:**
   ```
   ping 8.8.8.8
   ```
   - Should show replies (Google's DNS)
6. **Trace route to destination:**
   ```
   tracert google.com
   ```
   - Shows path packets take to reach destination
7. **Check network statistics:**
   ```
   netstat -an
   ```
   - Shows active connections and listening ports

**For Mac:**

1. **Open Terminal** - Applications → Utilities → Terminal
2. **Check IP configuration:**
   ```
   ifconfig
   ```
3. **Test connectivity to gateway:**
   ```
   ping [gateway-ip]
   ```
4. **Test DNS resolution:**
   ```
   nslookup google.com
   ```
5. **Test internet connectivity:**
   ```
   ping 8.8.8.8
   ```
6. **Trace route:**
   ```
   traceroute google.com
   ```
7. **Check network statistics:**
   ```
   netstat -an
   ```

### Step 2: Troubleshoot DNS Issues

DNS problems prevent website access:

1. **Test current DNS:**
   ```
   nslookup google.com
   ```
   - Note which DNS server responds
2. **Test with Google DNS:**
   ```
   nslookup google.com 8.8.8.8
   ```
   - If this works, your DNS is the issue
3. **Flush DNS cache:**
   - **Windows:** `ipconfig /flushdns`
   - **Mac:** `sudo dscacheutil -flushcache`
4. **Change DNS servers:**
   - **Windows:** Settings → Network → WiFi → Properties → Edit DNS settings
   - **Mac:** System Preferences → Network → WiFi → Advanced → DNS
5. **Try alternative DNS servers:**
   - Google: 8.8.8.8 and 8.8.4.4
   - Cloudflare: 1.1.1.1 and 1.0.0.1
   - OpenDNS: 208.67.222.222 and 208.67.220.220
6. **Verify DNS resolution:**
   ```
   nslookup google.com
   ```
   - Should now resolve correctly

### Step 3: Check IP Configuration

Verify correct IP settings:

1. **View current IP configuration:**
   - **Windows:** `ipconfig /all`
   - **Mac:** `ifconfig`
2. **Verify IP address:**
   - Should be in correct subnet (e.g., 192.168.1.x for home networks)
   - Should not be 169.254.x.x (indicates DHCP failure)
3. **Verify subnet mask:**
   - Typical: 255.255.255.0
   - Should match your network configuration
4. **Verify gateway:**
   - Should be first address in subnet (e.g., 192.168.1.1)
   - Should be reachable with `ping [gateway-ip]`
5. **Verify DNS servers:**
   - Should show at least one DNS server
   - Should be able to resolve domains
6. **If incorrect configuration:**
   - Release and renew DHCP lease:
     - **Windows:** `ipconfig /release` then `ipconfig /renew`
     - **Mac:** System Preferences → Network → WiFi → Advanced → TCP/IP → Renew DHCP Lease
   - Or configure static IP if required

### Step 4: Test Network Speed and Latency

Measure network performance:

1. **Test internet speed:**
   - Visit speedtest.net
   - Run test and note download/upload speeds
   - Compare to your ISP plan speeds
2. **Check latency (ping):**
   ```
   ping google.com
   ```
   - Note average latency
   - Should be under 50ms for local network
   - Should be under 100ms for internet
3. **Check for packet loss:**
   ```
   ping -c 100 google.com
   ```
   - Should show 0% packet loss
   - Any loss indicates network issues
4. **Test specific server:**
   ```
   ping [server-ip]
   ```
   - If high latency or loss, network path may be congested
5. **Identify bottleneck:**
   - If internet speed is low, issue is ISP or modem
   - If latency is high, issue is network path or server

### Step 5: Troubleshoot WiFi Issues

For wireless network problems:

1. **Check WiFi signal strength:**
   - **Windows:** `netsh wlan show interfaces`
   - **Mac:** Hold Option → Click WiFi icon
   - Signal should be -40 dBm or better
2. **Check WiFi channel:**
   - **Windows:** `netsh wlan show networks mode=Bssid`
   - **Mac:** Hold Option → Click WiFi icon
   - If many networks on same channel, interference likely
3. **Scan for interference:**
   - Download WiFi analyzer app
   - Identify least congested channel
   - Change router to that channel
4. **Optimize WiFi placement:**
   - Position router centrally
   - Elevate router (not on floor)
   - Avoid obstacles and metal objects
   - Keep away from microwave and cordless phones
5. **Update WiFi driver:**
   - Device Manager → Network adapters → Right-click → Update driver
6. **Restart WiFi router:**
   - Unplug for 30 seconds
   - Plug back in and wait 2-3 minutes
   - Reconnect to WiFi

### Step 6: Check Firewall Settings

Firewall may block network access:

**For Windows Firewall:**
1. **Open Windows Defender Firewall** - Settings → Firewall & network protection
2. **Click "Allow an app through firewall"**
3. **Review allowed apps** - Ensure necessary apps are allowed
4. **Add app if needed** - Click "Change settings" → "Allow another app"
5. **Check inbound/outbound rules** - May need to add specific rules
6. **Test connectivity** - Verify issue is resolved

**For Mac Firewall:**
1. **System Preferences** → **Security & Privacy** → **Firewall**
2. **Click "Firewall Options"**
3. **Review blocked applications** - Ensure necessary apps aren't blocked
4. **Add app if needed** - Click + button to add exception
5. **Test connectivity** - Verify issue is resolved

### Step 7: Resolve IP Address Conflicts

If multiple devices have same IP:

1. **Identify conflicting IP:**
   - Run `ipconfig /all` to see your IP
   - Note the IP address
2. **Find conflicting device:**
   - On another device, run `nslookup [ip-address]` to find hostname
   - Or use network scanner tool
3. **Release DHCP lease:**
   - `ipconfig /release` (Windows)
   - System Preferences → Network → Renew DHCP Lease (Mac)
4. **Renew DHCP lease:**
   - `ipconfig /renew` (Windows)
   - System Preferences → Network → Renew DHCP Lease (Mac)
5. **Verify new IP assigned** - Should be different from conflicting IP
6. **If issue persists:**
   - Configure static IP outside DHCP range
   - Or adjust DHCP pool on router

### Step 8: Troubleshoot VPN Connection Issues

For VPN connectivity problems:

1. **Verify VPN server is reachable:**
   ```
   ping [vpn-server-ip]
   ```
2. **Check if port is open:**
   - **Windows:** `netstat -an | findstr [port]`
   - **Mac:** `netstat -an | grep [port]`
3. **Verify firewall allows VPN:**
   - Check firewall rules for VPN port
   - Ensure port is not blocked by ISP
4. **Test from different network:**
   - Try connecting from mobile hotspot
   - If works, ISP may be blocking VPN port
5. **Check VPN client logs:**
   - Look for error messages
   - Note error codes for IT support
6. **Update VPN client:**
   - Download latest version
   - Reinstall if necessary
7. **Try different VPN protocol:**
   - Some protocols work better on certain networks
   - Contact IT for alternative options

### Step 9: Monitor Network Performance

Track network issues over time:

1. **Use network monitoring tools:**
   - **Windows:** Performance Monitor or NetLimiter
   - **Mac:** Network Radar or Wireless Diagnostics
2. **Monitor bandwidth usage:**
   - Identify applications consuming excessive bandwidth
   - Limit or close if necessary
3. **Check network latency:**
   - Run periodic ping tests
   - Note if latency increases over time
4. **Monitor packet loss:**
   - Run periodic ping tests with packet loss check
   - Note if loss increases
5. **Document findings:**
   - Keep log of network issues
   - Note time, duration, and impact
   - Share with IT for analysis

### Step 10: Advanced Troubleshooting

For persistent network issues:

1. **Disable IPv6:**
   - **Windows:** `netsh int ipv6 set state disabled`
   - **Mac:** System Preferences → Network → Advanced → TCP/IP
   - Some networks have IPv6 issues
2. **Reset network settings:**
   - **Windows:** `ipconfig /all` then manually configure
   - **Mac:** System Preferences → Network → Advanced → Reset
3. **Check network drivers:**
   - Device Manager → Network adapters → Update drivers
4. **Test with different hardware:**
   - Try different ethernet cable
   - Try different WiFi adapter
   - Try different router port
5. **Contact ISP:**
   - If internet speed is consistently low
   - If frequent disconnections occur
   - If modem shows error lights

## When to Escalate

Contact your IT support team if:

- Network issues persist after trying all steps
- Multiple devices affected simultaneously
- Cannot access company resources
- Suspect network security issue
- Need to configure advanced network settings
- Need to add static routes
- Need to configure QoS (Quality of Service)
- Suspect hardware failure

## Prevention & Best Practices

**Maintain Network Health:**
- Keep network drivers updated
- Restart router weekly
- Monitor network performance regularly
- Keep firewall rules current
- Use strong WiFi passwords
- Change WiFi password periodically
- Keep network documentation updated

**Optimize Network Performance:**
- Position WiFi router centrally
- Use 5GHz band for faster speeds
- Limit number of connected devices
- Disable unused network services
- Use wired connection for critical devices
- Implement QoS for bandwidth management
- Monitor and limit bandwidth-heavy applications

**Ensure Network Security:**
- Use WPA3 encryption (or WPA2 if WPA3 unavailable)
- Change default router credentials
- Disable WPS (WiFi Protected Setup)
- Keep router firmware updated
- Use VPN for remote access
- Monitor network for unauthorized devices
- Implement network segmentation

## FAQ

**Q: What's a good ping time?**
A: Under 50ms is excellent. 50-100ms is good. Over 100ms may cause lag in real-time applications.

**Q: What's normal packet loss?**
A: 0% is normal. Any packet loss indicates network issues.

**Q: Should I use WiFi or ethernet?**
A: Ethernet is faster and more reliable. Use for critical devices. WiFi is convenient for mobile devices.

**Q: How do I improve WiFi speed?**
A: Move closer to router, use 5GHz band, reduce interference, update drivers, or upgrade router.

**Q: What's the difference between latency and bandwidth?**
A: Bandwidth is speed (Mbps). Latency is delay (ms). Both important for different reasons.

**Q: Can I have multiple DNS servers?**
A: Yes, typically 2 primary and 2 secondary. Router will try primary first, then secondary if primary fails.

## Contact Support

If you've tried all troubleshooting steps and network issues persist:

- **Email:** support@gigitekai.com
- **Phone:** (609) 676-4483
- **Hours:** Monday-Friday, 8 AM - 6 PM EST
- **Response Time:** Usually within 1 hour during business hours

**Include in your support request:**
- Network type (WiFi/Ethernet)
- Device type and OS version
- Network diagnostics output (ipconfig, ping results)
- Error messages you're seeing
- Steps you've already tried
- Whether issue affects one device or multiple devices
- When the issue started
- ISP name and plan speed

---

**Last Updated:** April 2026 | **Version:** 1.0 | **Author:** GigitekAI Support Team
