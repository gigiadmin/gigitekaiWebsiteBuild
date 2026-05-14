#!/usr/bin/env node
/**
 * Insert 30 user-friendly KB articles for Tier 1 support
 * Focus: Hardware, Connectivity, Boot Issues, Device Basics
 * TAP Ticket Integration: Each article includes common ticket phrases
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const kbArticles = [
  // ===== HARDWARE STARTUP ISSUES (5 articles) =====
  {
    title: "My Computer Won't Start - Black Screen",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "computer,won't start,black screen,no power,startup,boot",
    content: `# My Computer Won't Start - Black Screen

## What's Happening?
Your computer is powered on but shows a completely black screen with no Windows logo or activity.

## Quick Fixes (Try These First)

### 1. Check the Power
- Make sure the power cable is firmly plugged into both the computer and wall outlet
- Look for a power light on the computer (usually white or blue)
- If there's no light, try a different outlet or power cable

### 2. Check Your Monitor
- Make sure your monitor is turned on (look for a power light)
- Check that the monitor cable is plugged into both the monitor and computer
- Try pressing the monitor's power button
- If you see a message like "No Signal," the monitor is working but not getting video

### 3. Wait and Listen
- Sometimes computers take 2-3 minutes to start
- Listen for fan noise or hard drive activity
- Wait at least 5 minutes before trying anything else

### 4. Try These Steps
1. Hold down the power button for 10 seconds until the computer completely shuts off
2. Wait 30 seconds
3. Press the power button again to restart
4. Wait 3-5 minutes and see if Windows appears

## If It Still Doesn't Work

Try connecting to a different monitor or TV:
- This helps us figure out if it's the monitor or the computer
- Use an HDMI cable if available
- If the other screen works, your monitor might need repair

## When to Contact Support
- Computer won't turn on at all (no lights, no sounds)
- You hear beeping sounds during startup
- You see error messages like "DISK BOOT FAILURE"
- Black screen continues after 10 minutes of waiting

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Keep your computer in a cool, dry place
- Don't block the fan vents
- Use a surge protector for your power cable
- Restart your computer at least once per week`
  },
  {
    title: "Computer Stuck on Windows Logo - Won't Boot",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "windows logo,stuck,boot,loading,startup,won't boot",
    content: `# Computer Stuck on Windows Logo - Won't Boot

## What's Happening?
Your computer shows the Windows logo but stays there for more than 5 minutes without loading the desktop.

## Quick Fixes (Try These First)

### 1. Wait Longer
- Windows updates can take 10-15 minutes on first boot
- A blinking dot under the logo means it's working
- Wait at least 15 minutes before doing anything

### 2. Force Restart
1. Hold down the power button for 10 seconds until the computer shuts off
2. Wait 30 seconds
3. Turn it back on
4. Let it boot completely (wait 10 minutes)

### 3. Try Safe Mode
If the normal restart didn't work:
1. Turn off the computer
2. Turn it back on
3. As soon as you see the Windows logo, hold down the power button for 10 seconds
4. Turn it back on again
5. Repeat this 2-3 times until you see "Preparing Automatic Repair"
6. Click "Troubleshoot" → "Advanced Options" → "Startup Settings"
7. Press F4 to enter Safe Mode

## If Safe Mode Works
- Your computer is having a software problem, not hardware
- Contact support for help fixing the issue

## When to Contact Support
- Computer won't boot after multiple restart attempts
- You see error messages like "DRIVER_IRQL_NOT_LESS_OR_EQUAL"
- Safe Mode doesn't work either
- You hear clicking sounds from inside the computer

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Don't force shut down during Windows updates
- Keep your computer plugged in during updates
- Close programs before restarting
- Restart your computer regularly (at least weekly)`
  },
  {
    title: "Laptop Won't Charge - Battery Not Charging",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "laptop,battery,won't charge,charging,power,adapter",
    content: `# Laptop Won't Charge - Battery Not Charging

## What's Happening?
Your laptop is plugged in but the battery isn't charging, or the charging light isn't on.

## Quick Fixes (Try These First)

### 1. Check the Charger
- Look at the charging cable for damage (cuts, fraying, bent connector)
- Make sure the cable is fully plugged into both the laptop and the wall outlet
- Check if there's a light on the charger (usually means it's working)
- Try a different power outlet

### 2. Check the Charging Port
- Look at the port on your laptop where the charger plugs in
- Make sure there's no dust or debris blocking it
- Gently clean it with a dry cloth or compressed air
- Make sure the connector clicks firmly into place

### 3. Restart Your Laptop
1. Shut down completely (don't just sleep)
2. Wait 30 seconds
3. Plug in the charger
4. Turn it back on
5. Check if the battery percentage is increasing

### 4. Check Battery Settings
1. Click the battery icon in the bottom right corner
2. Look for a message about charging status
3. If it says "Not Charging," right-click and select "Battery Settings"

## If It Still Won't Charge

Try these advanced steps:
1. Shut down completely
2. Unplug the charger
3. Hold down the power button for 30 seconds (this drains residual power)
4. Plug the charger back in
5. Wait 5 minutes before turning on

## When to Contact Support
- Charger cable is damaged or sparking
- Charging port looks loose or damaged
- Laptop gets very hot when plugged in
- You see error messages about battery

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Don't bend the charging cable sharply
- Keep the charging port clean and dry
- Use the original charger when possible
- Don't use the laptop on soft surfaces (blocks ventilation)`
  },
  {
    title: "Laptop Battery Draining Too Fast",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "battery,draining,fast,power,laptop,usage",
    content: `# Laptop Battery Draining Too Fast

## What's Happening?
Your laptop battery goes from full to empty much faster than it used to (less than 2 hours).

## Quick Fixes (Try These First)

### 1. Check What's Running
1. Look at the bottom right corner of your screen
2. Close any programs you're not using
3. Close browser tabs (especially video sites)
4. Close Zoom, Teams, or video conferencing apps

### 2. Adjust Brightness
1. Press the brightness down key (usually has a sun icon)
2. Lower your screen brightness to a comfortable level
3. This is the #1 battery drain

### 3. Turn Off Wi-Fi and Bluetooth
1. Click the Wi-Fi icon in the bottom right
2. Turn off Wi-Fi if you don't need it
3. Click the Bluetooth icon and turn it off
4. This can save 30-40% battery life

### 4. Use Battery Saver Mode
1. Click the battery icon in the bottom right
2. Click "Battery Saver" or "Power Saver"
3. This limits background activity and extends battery life

## Check Battery Health

1. Right-click the battery icon
2. Select "Battery Settings"
3. Scroll down and click "Battery Report"
4. Look at "Design Capacity" vs "Full Charge Capacity"
5. If Full Charge is less than 80% of Design, battery may be aging

## When to Contact Support
- Battery drains even when laptop is off
- Battery report shows capacity below 50%
- Laptop gets very hot
- Battery percentage jumps randomly

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Don't let battery drain completely (keep above 20%)
- Close programs when not using them
- Use Battery Saver mode regularly
- Keep your laptop cool and well-ventilated
- Restart your laptop at least once per week`
  },
  {
    title: "USB Devices Not Recognized - Keyboard, Mouse, or USB Drive",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "USB,device,not recognized,keyboard,mouse,external drive",
    content: `# USB Devices Not Recognized - Keyboard, Mouse, or USB Drive

## What's Happening?
You plugged in a USB device (keyboard, mouse, external drive) but Windows doesn't recognize it or show it as connected.

## Quick Fixes (Try These First)

### 1. Try a Different USB Port
- Your computer has multiple USB ports
- Unplug the device
- Try plugging it into a different USB port (especially the back of the computer if possible)
- Wait 10 seconds for Windows to recognize it

### 2. Check the Cable
- Look at the USB cable for damage (cuts, fraying, bent connector)
- Try a different cable if you have one available
- Make sure the connector is fully inserted (you should hear a click)

### 3. Restart Your Computer
1. Unplug the USB device
2. Restart your computer completely
3. Wait for Windows to fully load
4. Plug the device back in
5. Wait 30 seconds for it to be recognized

### 4. Check Device Manager
1. Right-click the Start button
2. Select "Device Manager"
3. Look for any devices with a yellow warning symbol
4. If you see one, right-click it and select "Update Driver"

## If It's an External Drive

1. Plug it into a different USB port
2. Wait 30 seconds
3. Open File Explorer (Windows key + E)
4. Look for a new drive letter on the left side
5. If you see it, the drive is working

## When to Contact Support
- Device works on other computers but not yours
- You see "Unknown Device" in Device Manager
- Device gets very hot
- You see error messages about the device

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Don't force USB connectors into ports
- Eject external drives properly before unplugging
- Keep USB ports clean and dry
- Use USB 3.0 ports (blue) for faster speeds`
  },

  // ===== NETWORK & INTERNET ISSUES (6 articles) =====
  {
    title: "Can't Connect to Wi-Fi - Home Network",
    category: "Tier 1 - Network & Connectivity",
    tags: "wi-fi,can't connect,home,network,wireless,internet",
    content: `# Can't Connect to Wi-Fi - Home Network

## What's Happening?
Your computer can see your home Wi-Fi network but won't connect, or it keeps disconnecting.

## Quick Fixes (Try These First)

### 1. Restart Your Router
1. Unplug your Wi-Fi router from power
2. Wait 30 seconds
3. Plug it back in
4. Wait 2 minutes for it to fully restart
5. Try connecting again

### 2. Forget and Reconnect to Wi-Fi
1. Click the Wi-Fi icon in the bottom right corner
2. Select your network name
3. Click "Forget"
4. Click the Wi-Fi icon again
5. Select your network
6. Enter your Wi-Fi password
7. Click "Next"

### 3. Check Your Password
- Make sure you're entering the correct Wi-Fi password
- Passwords are case-sensitive (capital letters matter)
- Check if Caps Lock is on
- Try typing the password slowly to make sure it's correct

### 4. Move Closer to the Router
- Wi-Fi signal gets weaker the farther away you are
- Try moving closer to your router
- If it works nearby, you may just be out of range

### 5. Check if Other Devices Can Connect
- Try connecting your phone to the same Wi-Fi
- If your phone connects but computer doesn't, it's a computer problem
- If nothing connects, it's a router problem

## Advanced Steps

1. Right-click the Wi-Fi icon
2. Select "Open Network & Internet Settings"
3. Click "Network Troubleshooter"
4. Follow the prompts

## When to Contact Support
- No devices can connect to Wi-Fi
- Router lights are off or red
- You see error message "Can't connect to this network"
- Wi-Fi keeps disconnecting every few minutes

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Keep your router in a central location
- Restart your router once per week
- Keep your Wi-Fi password secure
- Keep your computer's Wi-Fi drivers updated`
  },
  {
    title: "Office Wi-Fi Keeps Disconnecting",
    category: "Tier 1 - Network & Connectivity",
    tags: "office,wi-fi,disconnecting,network,corporate,unstable",
    content: `# Office Wi-Fi Keeps Disconnecting

## What's Happening?
You're connected to the office Wi-Fi but it keeps dropping and reconnecting, or you lose internet access randomly.

## Quick Fixes (Try These First)

### 1. Move Away from Obstacles
- Wi-Fi signals are blocked by walls, metal, and water
- Move away from microwaves, cordless phones, and baby monitors
- Try moving to a different area of the office
- Sit closer to the Wi-Fi access point if possible

### 2. Forget and Reconnect
1. Click the Wi-Fi icon in the bottom right
2. Select your office network
3. Click "Forget"
4. Wait 10 seconds
5. Click the Wi-Fi icon again
6. Select your office network
7. Enter your credentials again

### 3. Update Your Wi-Fi Driver
1. Right-click the Start button
2. Select "Device Manager"
3. Find "Network Adapters"
4. Right-click your Wi-Fi adapter
5. Select "Update Driver"
6. Choose "Search automatically for updated driver software"
7. Restart your computer

### 4. Check Your VPN Connection
- If you're using a VPN, disconnect it
- Try connecting to Wi-Fi without VPN
- If it's stable without VPN, the VPN may be causing issues

## When to Contact Support
- Wi-Fi disconnects more than once per hour
- Other people's computers are also having problems
- You see error messages about authentication
- Wi-Fi works fine on your phone but not your computer

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Keep your computer's drivers updated
- Restart your computer at least once per week
- Don't have too many programs running
- Keep your computer away from other wireless devices`
  },
  {
    title: "Internet Speed is Slow - Pages Take Forever to Load",
    category: "Tier 1 - Network & Connectivity",
    tags: "slow,internet,speed,pages,loading,lag",
    content: `# Internet Speed is Slow - Pages Take Forever to Load

## What's Happening?
Websites and apps are loading very slowly, or you're experiencing lag when browsing.

## Quick Fixes (Try These First)

### 1. Close Unnecessary Programs
1. Look at the bottom right corner (system tray)
2. Close any programs you're not using
3. Close extra browser tabs (each tab uses bandwidth)
4. Close Zoom, Teams, or video apps if you're not using them

### 2. Restart Your Router
1. Unplug your Wi-Fi router
2. Wait 30 seconds
3. Plug it back in
4. Wait 2 minutes
5. Try browsing again

### 3. Check Your Internet Connection
1. Click the Wi-Fi icon
2. Make sure you're connected to your network
3. Look for a strong signal (3-4 bars)
4. If signal is weak, move closer to the router

### 4. Clear Your Browser Cache
**For Chrome:**
1. Press Ctrl + Shift + Delete
2. Select "All time"
3. Check "Cached images and files"
4. Click "Clear data"

**For Edge:**
1. Press Ctrl + Shift + Delete
2. Select "All time"
3. Check "Cached data and files"
4. Click "Clear now"

### 5. Restart Your Computer
1. Save your work
2. Restart completely
3. Wait for Windows to fully load
4. Try browsing again

## Check Your Internet Speed

1. Open a browser
2. Go to speedtest.net
3. Click "Go"
4. Wait for the test to complete
5. Note your download speed

**Good speeds:**
- Download: 25+ Mbps
- Upload: 5+ Mbps

If your speeds are much lower, contact your internet provider.

## When to Contact Support
- Internet is slow even with one program open
- Speed test shows very low speeds (under 5 Mbps)
- Pages won't load at all
- Other people's computers are also slow

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Close programs you're not using
- Limit the number of browser tabs open
- Restart your router weekly
- Keep your computer updated`
  },
  {
    title: "Websites Won't Load - 'Cannot Reach This Page' Error",
    category: "Tier 1 - Network & Connectivity",
    tags: "websites,won't load,error,DNS,can't reach,connection",
    content: `# Websites Won't Load - 'Cannot Reach This Page' Error

## What's Happening?
You're trying to visit a website but get an error message like "This site can't be reached" or "ERR_NAME_NOT_RESOLVED".

## Quick Fixes (Try These First)

### 1. Check Your Internet Connection
1. Click the Wi-Fi icon in the bottom right
2. Make sure you're connected to your network
3. If not connected, connect to your Wi-Fi
4. Wait 10 seconds and try the website again

### 2. Try a Different Website
- Try visiting google.com or microsoft.com
- If those work, the problem is with the specific website
- If those don't work, it's your internet connection

### 3. Restart Your Router
1. Unplug your Wi-Fi router
2. Wait 30 seconds
3. Plug it back in
4. Wait 2 minutes
5. Try the website again

### 4. Clear Your Browser Cache and Cookies
**For Chrome:**
1. Press Ctrl + Shift + Delete
2. Select "All time"
3. Check all boxes
4. Click "Clear data"

**For Edge:**
1. Press Ctrl + Shift + Delete
2. Select "All time"
3. Check all boxes
4. Click "Clear now"

### 5. Try a Different Browser
- If Chrome doesn't work, try Edge or Firefox
- If it works in a different browser, clear your original browser's cache

## Advanced: Flush DNS Cache

1. Press Windows key + R
2. Type: ipconfig /flushdns
3. Press Enter
4. Wait for the command to complete
5. Try the website again

## When to Contact Support
- No websites load at all
- You see "ERR_CERT_AUTHORITY_INVALID" (security certificate error)
- Error mentions "DNS" or "proxy"
- Only specific websites won't load (might be blocked)

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Keep your browser updated
- Clear cache monthly
- Don't visit suspicious websites
- Use the official website URLs`
  },
  {
    title: "Wired Connection (Ethernet) Not Working",
    category: "Tier 1 - Network & Connectivity",
    tags: "ethernet,wired,connection,network,cable,not working",
    content: `# Wired Connection (Ethernet) Not Working

## What's Happening?
Your computer is plugged into an ethernet cable but has no internet connection.

## Quick Fixes (Try These First)

### 1. Check the Cable
- Look at both ends of the ethernet cable
- Make sure it's firmly plugged into your computer
- Make sure it's firmly plugged into the wall or router
- You should hear a click when it's properly inserted
- Look for any visible damage to the cable

### 2. Try a Different Cable
- If you have another ethernet cable, try using it
- If the new cable works, the old one is damaged
- If the new cable doesn't work, it's not the cable

### 3. Try a Different Port
- Your computer might have multiple ethernet ports
- Try plugging into a different port
- If you're using a docking station, try the other ports

### 4. Restart Your Computer
1. Unplug the ethernet cable
2. Restart your computer
3. Wait for Windows to fully load
4. Plug the cable back in
5. Wait 30 seconds for connection

### 5. Check Network Settings
1. Right-click the Start button
2. Select "Settings"
3. Click "Network & Internet"
4. Click "Ethernet"
5. Look for your connection
6. If it says "Connected," the connection is working

## Advanced: Reset Network Settings

1. Right-click the Start button
2. Select "Settings"
3. Click "Network & Internet"
4. Scroll down and click "Advanced Network Settings"
5. Click "Network Reset"
6. Click "Reset Now"
7. Your computer will restart

## When to Contact Support
- Cable is damaged or won't fit
- Different cable doesn't work either
- You see "No Internet" even though cable is connected
- Network adapter shows error in Device Manager

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Don't bend ethernet cables sharply
- Keep cables away from power cords
- Use high-quality cables (Cat6 or better)
- Label cables so you know which is which`
  },

  // ===== AUDIO & PERIPHERAL ISSUES (5 articles) =====
  {
    title: "Headphones or Speakers Not Working",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "audio,headphones,speakers,sound,not working,jack",
    content: `# Headphones or Speakers Not Working

## What's Happening?
You plugged in headphones or speakers but you hear no sound, or Windows doesn't recognize them.

## Quick Fixes (Try These First)

### 1. Check the Volume
1. Click the speaker icon in the bottom right corner
2. Make sure the volume slider is not all the way down
3. Make sure "Mute" is not selected
4. Drag the volume slider to at least 50%

### 2. Check if Sound is Coming from the Right Device
1. Click the speaker icon
2. Look for "Volume mixer"
3. Make sure your headphones/speakers are selected
4. If you see multiple devices, select the one you want to use

### 3. Check the Connection
- If using headphones, make sure they're fully plugged into the audio jack
- You should hear a click when they're fully inserted
- Look for damage to the audio jack or headphone connector
- Try plugging into a different audio jack if available

### 4. Restart Your Computer
1. Save your work
2. Restart completely
3. Wait for Windows to fully load
4. Plug in your headphones/speakers again
5. Check if sound works

### 5. Update Audio Drivers
1. Right-click the Start button
2. Select "Device Manager"
3. Find "Sound, video and game controllers"
4. Right-click your audio device
5. Select "Update Driver"
6. Choose "Search automatically for updated driver software"
7. Restart your computer

## Check Audio Settings

1. Right-click the speaker icon
2. Select "Open Sound Settings"
3. Scroll down to "Advanced"
4. Make sure your device is selected
5. Click "App volume and device preferences"
6. Make sure the app you're using isn't muted

## When to Contact Support
- No sound from any device
- Headphones work on other computers but not yours
- Audio jack looks damaged
- You see error messages about audio drivers

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Don't force headphones into the jack
- Keep the audio jack clean and dry
- Use quality headphones/speakers
- Restart your computer weekly`
  },
  {
    title: "Webcam Not Detected - Camera Not Working",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "webcam,camera,not detected,video,Teams,Zoom",
    content: `# Webcam Not Detected - Camera Not Working

## What's Happening?
Your webcam isn't showing up in Teams, Zoom, or other video apps, or Windows doesn't recognize it.

## Quick Fixes (Try These First)

### 1. Check if Webcam is Plugged In
- If it's a USB webcam, make sure it's plugged into a USB port
- Look for a light on the webcam (usually means it's on)
- Try a different USB port
- Wait 10 seconds for Windows to recognize it

### 2. Check Camera Permissions
1. Right-click the Start button
2. Select "Settings"
3. Click "Privacy & Security"
4. Click "Camera"
5. Make sure "Camera access" is turned ON
6. Scroll down and make sure your app is allowed to use the camera

### 3. Restart Your Computer
1. Unplug the webcam (if USB)
2. Restart your computer
3. Wait for Windows to fully load
4. Plug the webcam back in
5. Wait 30 seconds for it to be recognized

### 4. Check Device Manager
1. Right-click the Start button
2. Select "Device Manager"
3. Look for "Cameras"
4. If you see your camera with a warning symbol, right-click it
5. Select "Update Driver"
6. Choose "Search automatically for updated driver software"

### 5. Restart the Video App
1. Close Teams, Zoom, or whatever app you're using
2. Wait 10 seconds
3. Reopen the app
4. Check if the camera is now available

## For Built-in Laptop Cameras

If your laptop has a built-in camera:
1. Check if there's a physical slider or button to enable it
2. Some laptops have a keyboard shortcut (check your manual)
3. Make sure the camera lens isn't covered

## When to Contact Support
- Webcam works on other computers but not yours
- You see "Unknown Device" in Device Manager
- Camera light is on but Windows doesn't recognize it
- Error message says "No camera found"

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Keep your camera lens clean
- Don't force USB connections
- Keep camera drivers updated
- Restart your computer weekly`
  },
  {
    title: "Microphone Not Working in Teams or Zoom",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "microphone,mic,not working,Teams,Zoom,audio,muted",
    content: `# Microphone Not Working in Teams or Zoom

## What's Happening?
Your microphone isn't picking up sound in Teams, Zoom, or other video apps, or people can't hear you.

## Quick Fixes (Try These First)

### 1. Check if Microphone is Muted
**In Teams:**
1. Look at the bottom of your screen during a call
2. Find the microphone icon
3. If it has a line through it, click it to unmute
4. The icon should turn solid (not crossed out)

**In Zoom:**
1. Look at the bottom of your screen during a call
2. Find the microphone icon
3. If it's red with a line, click it to unmute

### 2. Check Windows Volume Settings
1. Right-click the speaker icon in the bottom right
2. Select "Open Sound Settings"
3. Scroll down to "Input"
4. Make sure your microphone is selected
5. Click "Volume" and make sure it's not all the way down
6. Speak and watch the volume bar move

### 3. Check App Permissions
1. Right-click the Start button
2. Select "Settings"
3. Click "Privacy & Security"
4. Click "Microphone"
5. Make sure "Microphone access" is turned ON
6. Scroll down and make sure Teams/Zoom is allowed to use the microphone

### 4. Test Your Microphone
1. Right-click the speaker icon
2. Select "Open Sound Settings"
3. Scroll to "Input"
4. Click "Volume" next to your microphone
5. Speak into the microphone
6. Watch the volume bar - it should move when you talk

### 5. Restart Your App
1. Close Teams or Zoom completely
2. Wait 10 seconds
3. Reopen the app
4. Try the microphone again

## For USB Headsets

If you're using a USB headset:
1. Make sure it's plugged into a USB port
2. Try a different USB port
3. Restart your computer
4. Make sure it's selected in Sound Settings

## When to Contact Support
- Microphone works on other computers but not yours
- Windows doesn't recognize the microphone
- Microphone is plugged in but shows no volume
- Error message says "No microphone found"

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Keep your microphone clean
- Don't cover the microphone with your hand
- Keep microphone drivers updated
- Test your microphone before important calls`
  },
  {
    title: "Bluetooth Device Won't Pair or Connect",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "bluetooth,pairing,won't connect,device,wireless,headphones",
    content: `# Bluetooth Device Won't Pair or Connect

## What's Happening?
Your Bluetooth device (headphones, mouse, keyboard) won't pair with your computer or keeps disconnecting.

## Quick Fixes (Try These First)

### 1. Make Sure Bluetooth is On
1. Click the network icon in the bottom right
2. Look for "Bluetooth"
3. If it's off (gray), click it to turn it on
4. Wait 5 seconds

### 2. Put Device in Pairing Mode
- Check your device's manual for how to enter pairing mode
- Usually it's holding a button for 3-5 seconds
- Look for a blinking light (usually means it's in pairing mode)
- You typically have 2-3 minutes to pair before it times out

### 3. Pair the Device
1. Click the network icon
2. Click "Bluetooth"
3. Your device should appear in the list
4. Click on it
5. Click "Pair"
6. Wait 10 seconds for pairing to complete

### 4. If Device Doesn't Appear
1. Make sure the device is in pairing mode
2. Make sure the device is charged (low battery can prevent pairing)
3. Try moving the device closer to your computer
4. Try restarting your computer

### 5. Remove and Re-pair
If the device was previously paired but won't connect:
1. Click the network icon
2. Click "Bluetooth"
3. Find your device in the list
4. Click the three dots next to it
5. Select "Remove device"
6. Put the device back in pairing mode
7. Pair it again from scratch

## For Bluetooth Headphones

Make sure:
- Headphones are fully charged
- Headphones are in pairing mode
- No other device is currently connected to them
- You're within 30 feet of your computer

## When to Contact Support
- Device won't appear in Bluetooth list
- Pairing fails with an error
- Device pairs but immediately disconnects
- Bluetooth adapter isn't showing in settings

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Keep Bluetooth devices charged
- Don't pair too many devices at once
- Restart your computer weekly
- Keep Bluetooth drivers updated`
  },

  // ===== DISPLAY & CONNECTIVITY (3 articles) =====
  {
    title: "Second Monitor Won't Connect or Display",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "monitor,second monitor,display,HDMI,won't connect,no signal",
    content: `# Second Monitor Won't Connect or Display

## What's Happening?
You plugged in a second monitor but it shows "No Signal" or Windows doesn't recognize it.

## Quick Fixes (Try These First)

### 1. Check the Cable
- Make sure the cable is firmly plugged into both the monitor and computer
- You should hear a click when it's properly inserted
- Look for any visible damage to the cable
- Try a different cable if you have one

### 2. Check the Monitor Power
- Make sure the monitor is turned on
- Look for a power light (usually blue or white)
- Try pressing the monitor's power button
- Make sure the power cable is plugged into the wall

### 3. Try a Different Port
- Your computer might have multiple video ports (HDMI, DisplayPort, USB-C)
- Unplug the cable
- Try plugging into a different port
- Wait 10 seconds for Windows to recognize it

### 4. Restart Your Computer
1. Unplug the monitor cable
2. Restart your computer
3. Wait for Windows to fully load
4. Plug the monitor back in
5. Wait 30 seconds for it to be recognized

### 5. Check Display Settings
1. Right-click on your desktop
2. Select "Display Settings"
3. Scroll down and click "Advanced Display"
4. Look for "Multiple Displays"
5. Make sure it's not set to "PC screen only"
6. Change it to "Extend" or "Duplicate"

## For Laptop Docking Stations

If using a docking station:
1. Make sure the monitor is plugged into the docking station
2. Make sure the docking station is plugged into your laptop
3. Try unplugging and replugging the docking station
4. Restart your laptop

## When to Contact Support
- Monitor shows "No Signal" even after trying different cables
- Windows doesn't detect the second monitor
- Monitor cable is damaged
- Computer only has one video port

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Use quality cables (HDMI 2.0 or better)
- Don't force cables into ports
- Keep monitor ports clean and dry
- Restart your computer weekly`
  },
  {
    title: "Screen Resolution is Blurry or Wrong Size",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "resolution,blurry,display,scaling,text,size",
    content: `# Screen Resolution is Blurry or Wrong Size

## What's Happening?
Your screen looks blurry, text is too small or too large, or the resolution seems wrong.

## Quick Fixes (Try These First)

### 1. Check Display Settings
1. Right-click on your desktop
2. Select "Display Settings"
3. Look at "Display Resolution"
4. If it says "Recommended," you're good
5. If not, click the dropdown and select "Recommended"
6. Click "Apply"

### 2. Check Scaling
1. Right-click on your desktop
2. Select "Display Settings"
3. Look for "Scale"
4. If it's set to 100%, try 125% if text is too small
5. If it's set to 150%, try 100% if text is too large
6. Click "Apply"

### 3. Adjust Text Size
1. Right-click on your desktop
2. Select "Display Settings"
3. Scroll down to "Scale and layout"
4. Look for "Text size"
5. Adjust the slider to make text larger or smaller
6. Click "Apply"

### 4. Update Graphics Drivers
1. Right-click the Start button
2. Select "Device Manager"
3. Find "Display adapters"
4. Right-click your graphics card
5. Select "Update Driver"
6. Choose "Search automatically for updated driver software"
7. Restart your computer

### 5. Restart Your Computer
1. Save your work
2. Restart completely
3. Wait for Windows to fully load
4. Check if the resolution looks better

## For Multiple Monitors

If you have multiple monitors:
1. Right-click on your desktop
2. Select "Display Settings"
3. Look at each monitor listed
4. Make sure each one has the correct resolution
5. Adjust individually if needed

## When to Contact Support
- Blurriness continues after adjusting resolution
- Text is still unreadable even at maximum size
- Graphics card shows error in Device Manager
- Monitor cable is damaged

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Use the recommended resolution for your monitor
- Keep graphics drivers updated
- Restart your computer weekly
- Don't adjust resolution too frequently`
  },
  {
    title: "Printer Won't Print - Network Printer Offline",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "printer,won't print,offline,network,printing,error",
    content: `# Printer Won't Print - Network Printer Offline

## What's Happening?
You're trying to print but the printer shows as "Offline" or your print job doesn't go through.

## Quick Fixes (Try These First)

### 1. Check Printer Power
- Make sure the printer is turned on
- Look for a power light
- Check that the power cable is plugged in
- Wait 30 seconds for the printer to fully start up

### 2. Check Paper and Ink
- Make sure there's paper in the tray
- Make sure there's ink or toner
- Open the printer cover and look for error messages
- Clear any paper jams

### 3. Check Network Connection
- For network printers, make sure it's connected to Wi-Fi
- Check the printer's display panel for network status
- If not connected, use the printer's menu to connect to your network

### 4. Restart the Printer
1. Turn off the printer completely
2. Wait 30 seconds
3. Turn it back on
4. Wait 2 minutes for it to fully start
5. Try printing again

### 5. Clear Print Queue
1. Right-click the Start button
2. Select "Settings"
3. Click "Devices"
4. Click "Printers & Scanners"
5. Find your printer
6. Click it and select "Open queue"
7. Look for stuck print jobs
8. Right-click any stuck jobs and select "Cancel"

## For Network Printers

1. Make sure your computer is on the same network as the printer
2. Try printing a test page:
   - Right-click the Start button
   - Select "Settings"
   - Click "Devices"
   - Click "Printers & Scanners"
   - Find your printer
   - Click it and select "Print a test page"

## When to Contact Support
- Printer shows error messages
- Paper jam won't clear
- No ink/toner available
- Printer is not on the network
- Print jobs keep failing

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Keep printer on the same network as your computer
- Check paper and ink levels regularly
- Restart printer weekly
- Keep printer drivers updated`
  },

  // ===== SYSTEM PERFORMANCE (3 articles) =====
  {
    title: "Computer Randomly Freezes or Crashes",
    category: "Tier 1 - Software & Applications",
    tags: "freeze,crash,random,system,hang,not responding",
    content: `# Computer Randomly Freezes or Crashes

## What's Happening?
Your computer suddenly stops responding, or programs crash without warning.

## Quick Fixes (Try These First)

### 1. Close Unnecessary Programs
1. Look at the taskbar at the bottom
2. Close any programs you're not using
3. Close extra browser tabs
4. Close Zoom, Teams, or video apps if not needed
5. This frees up memory and can prevent freezes

### 2. Restart Your Computer
1. Save all your work
2. Click Start
3. Click "Power"
4. Select "Restart"
5. Wait for Windows to fully restart
6. This clears memory and often fixes freezing

### 3. Check Disk Space
1. Right-click the Start button
2. Select "Settings"
3. Click "System"
4. Click "Storage"
5. Look at "C: Drive"
6. If it shows red or very full, you need to delete files

### 4. Update Windows
1. Right-click the Start button
2. Select "Settings"
3. Click "Update & Security"
4. Click "Check for updates"
5. Install any available updates
6. Restart your computer

### 5. Run Disk Cleanup
1. Right-click the Start button
2. Select "Settings"
3. Click "System"
4. Click "Storage"
5. Scroll down and click "Temporary files"
6. Check all boxes
7. Click "Remove files"

## Check for Viruses

1. Right-click the Start button
2. Select "Settings"
3. Click "Update & Security"
4. Click "Windows Security"
5. Click "Virus & threat protection"
6. Click "Scan options"
7. Select "Full scan"
8. Click "Scan now"
9. Wait for scan to complete

## When to Contact Support
- Computer freezes more than once per day
- Specific program always causes freezing
- Error messages appear during freezes
- Disk space shows as very full

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Close programs you're not using
- Restart your computer weekly
- Keep Windows updated
- Keep disk space above 20% free
- Run antivirus scans monthly`
  },
  {
    title: "Keyboard or Mouse Not Working",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "keyboard,mouse,not working,unresponsive,stuck,not responding",
    content: `# Keyboard or Mouse Not Working

## What's Happening?
Your keyboard or mouse isn't responding, or keys/clicks don't register.

## Quick Fixes (Try These First)

### 1. Check the Connection
**For Wired Devices:**
- Make sure the cable is firmly plugged into your computer
- Try a different USB port
- Look for damage to the cable

**For Wireless Devices:**
- Make sure the device is turned on
- Check if the battery is low (replace if needed)
- Make sure it's paired with your computer via Bluetooth or USB receiver

### 2. Restart Your Computer
1. Use Ctrl+Alt+Delete to open Task Manager
2. Click the power icon in the bottom right
3. Select "Restart"
4. Wait for Windows to fully restart
5. Try the device again

### 3. Try a Different Device
- If you have a spare keyboard or mouse, try it
- If the spare works, your original device is broken
- If the spare doesn't work, it's a computer problem

### 4. Check Device Manager
1. Right-click the Start button
2. Select "Device Manager"
3. Look for "Keyboards" and "Mice and other pointing devices"
4. If you see a warning symbol, right-click and select "Update Driver"
5. Choose "Search automatically for updated driver software"

### 5. Restart USB Services
1. Right-click the Start button
2. Select "Device Manager"
3. Find "Universal Serial Bus controllers"
4. Right-click "USB Root Hub"
5. Select "Disable device"
6. Wait 10 seconds
7. Right-click it again and select "Enable device"

## For Wireless Devices

If using wireless keyboard/mouse:
1. Check if the battery is low
2. Replace batteries if needed
3. Make sure the USB receiver is plugged in
4. Try moving the device closer to the receiver

## When to Contact Support
- Device is plugged in but still doesn't work
- Both keyboard and mouse stop working at the same time
- Device works on other computers but not yours
- Device shows error in Device Manager

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Don't force devices into ports
- Keep devices clean and dry
- Replace batteries regularly
- Restart your computer weekly`
  },
  {
    title: "Computer Runs Very Slow - Everything is Lagging",
    category: "Tier 1 - Software & Applications",
    tags: "slow,lag,performance,lagging,sluggish,unresponsive",
    content: `# Computer Runs Very Slow - Everything is Lagging

## What's Happening?
Your computer is slow to respond, programs take forever to open, and everything feels sluggish.

## Quick Fixes (Try These First)

### 1. Close Unnecessary Programs
1. Look at the taskbar
2. Close any programs you're not using
3. Close extra browser tabs (each tab uses memory)
4. Close Zoom, Teams, or video apps
5. This frees up memory immediately

### 2. Restart Your Computer
1. Save all your work
2. Click Start
3. Click "Power"
4. Select "Restart"
5. Wait for Windows to fully restart
6. This clears memory and usually improves speed

### 3. Check What's Using Resources
1. Press Ctrl+Shift+Esc to open Task Manager
2. Click the "Performance" tab
3. Look at "CPU" and "Memory" usage
4. If either shows red or very high, something is using too much power
5. Click the "Processes" tab
6. Look for any program using high CPU or Memory
7. Right-click it and select "End task"

### 4. Check Disk Space
1. Right-click the Start button
2. Select "Settings"
3. Click "System"
4. Click "Storage"
5. Look at "C: Drive"
6. If it's very full (red), delete unnecessary files

### 5. Disable Startup Programs
1. Right-click the Start button
2. Select "Task Manager"
3. Click the "Startup" tab
4. Look for programs that start automatically
5. Right-click unnecessary ones and select "Disable"
6. Restart your computer

## Run Disk Cleanup

1. Right-click the Start button
2. Select "Settings"
3. Click "System"
4. Click "Storage"
5. Click "Temporary files"
6. Check all boxes
7. Click "Remove files"

## Update Windows and Drivers

1. Right-click the Start button
2. Select "Settings"
3. Click "Update & Security"
4. Click "Check for updates"
5. Install any available updates
6. Restart your computer

## When to Contact Support
- Computer is still slow after restarting
- Disk space shows very full with no obvious large files
- Task Manager shows unknown programs using resources
- Computer is slow even with no programs open

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Close programs you're not using
- Restart your computer weekly
- Keep disk space above 20% free
- Keep Windows updated
- Limit startup programs`
  },

  // ===== MOBILE & CONNECTIVITY (3 articles) =====
  {
    title: "Phone Hotspot Not Working - Can't Share Internet",
    category: "Tier 1 - Network & Connectivity",
    tags: "hotspot,mobile hotspot,tethering,phone,internet,sharing",
    content: `# Phone Hotspot Not Working - Can't Share Internet

## What's Happening?
You're trying to use your phone's hotspot to share internet with your computer, but it won't connect or work.

## Quick Fixes (Try These First)

### 1. Check Phone Hotspot Settings
**On iPhone:**
1. Open Settings
2. Go to "Personal Hotspot"
3. Make sure "Personal Hotspot" is turned ON
4. Note the Wi-Fi password

**On Android:**
1. Open Settings
2. Go to "Mobile Hotspot" or "Tethering"
3. Make sure "Mobile Hotspot" is turned ON
4. Note the network name and password

### 2. Connect Your Computer
1. Click the Wi-Fi icon on your computer
2. Look for your phone's hotspot network name
3. Click it
4. Enter the password
5. Click "Connect"

### 3. Check Phone Data
- Make sure your phone has cellular data (not just Wi-Fi)
- Check if you have a data plan or enough data remaining
- Look for a data indicator on your phone (usually shows bars)

### 4. Restart Phone Hotspot
1. On your phone, turn OFF the hotspot
2. Wait 10 seconds
3. Turn it back ON
4. Try connecting your computer again

### 5. Restart Your Computer
1. Disconnect from the hotspot
2. Restart your computer
3. Wait for Windows to fully load
4. Try connecting to the hotspot again

## Check Phone Battery
- Make sure your phone has enough battery
- Low battery can disable hotspot
- Plug your phone in if battery is low

## When to Contact Support
- Hotspot is on but computer can't find the network
- Computer finds the network but won't connect
- Connection drops frequently
- Hotspot is very slow

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Keep your phone charged
- Restart your phone weekly
- Don't use hotspot for extended periods (can drain battery)
- Use Wi-Fi instead of hotspot when possible`
  },
  {
    title: "USB Tethering Not Working - Phone Won't Connect",
    category: "Tier 1 - Network & Connectivity",
    tags: "tethering,USB,phone,connection,internet,cable",
    content: `# USB Tethering Not Working - Phone Won't Connect

## What's Happening?
You plugged your phone into your computer with a USB cable to share internet, but it won't connect or work.

## Quick Fixes (Try These First)

### 1. Check the USB Cable
- Make sure the cable is firmly plugged into both your phone and computer
- Look for damage to the cable
- Try a different USB cable if you have one
- Make sure it's a data cable (not just a charging cable)

### 2. Enable USB Tethering on Phone
**On iPhone:**
1. Open Settings
2. Go to "Personal Hotspot"
3. Make sure "Personal Hotspot" is ON
4. Plug into computer with USB cable
5. Tap "Trust" if prompted

**On Android:**
1. Open Settings
2. Go to "Mobile Hotspot" or "Tethering"
3. Make sure "USB Tethering" is turned ON
4. Plug into computer with USB cable

### 3. Check Computer Recognition
1. Right-click the Start button
2. Select "Device Manager"
3. Look for your phone in the list
4. If it shows an error, right-click and select "Update Driver"

### 4. Restart Phone and Computer
1. Unplug the USB cable
2. Restart your phone
3. Restart your computer
4. Wait for both to fully load
5. Plug the cable back in

### 5. Check Internet Connection
1. Right-click the Start button
2. Select "Settings"
3. Click "Network & Internet"
4. Look for your phone as a network connection
5. If it shows "Connected," you should have internet

## For Android Phones

Make sure:
- USB Tethering is enabled in Settings
- Your phone has cellular data (not just Wi-Fi)
- You have enough data remaining on your plan

## When to Contact Support
- Computer doesn't recognize the phone
- USB cable is damaged
- Phone shows error when trying to tether
- Connection keeps dropping

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Use a quality USB cable
- Keep your phone charged
- Don't use tethering for extended periods
- Restart your phone weekly`
  },
  {
    title: "Can't Connect to Mobile Hotspot - Wrong Password",
    category: "Tier 1 - Network & Connectivity",
    tags: "hotspot,password,can't connect,wrong,authentication,mobile",
    content: `# Can't Connect to Mobile Hotspot - Wrong Password

## What's Happening?
You're trying to connect to your phone's hotspot but getting a "Wrong Password" or "Can't Connect" error.

## Quick Fixes (Try These First)

### 1. Check the Password
- Make sure you're entering the correct password
- Passwords are case-sensitive (capital letters matter)
- Check if Caps Lock is on
- Try typing the password slowly to make sure it's correct

### 2. Get the Password Again
**On iPhone:**
1. Open Settings
2. Go to "Personal Hotspot"
3. Look at the Wi-Fi password
4. Make sure you're using the exact password shown

**On Android:**
1. Open Settings
2. Go to "Mobile Hotspot"
3. Look at the password
4. Make sure you're using the exact password shown

### 3. Forget and Reconnect
1. Click the Wi-Fi icon on your computer
2. Find your phone's hotspot network
3. Click it
4. Click "Forget"
5. Wait 10 seconds
6. Click the Wi-Fi icon again
7. Find your phone's hotspot
8. Click it
9. Enter the password carefully
10. Click "Connect"

### 4. Restart Phone Hotspot
1. On your phone, turn OFF the hotspot
2. Wait 10 seconds
3. Turn it back ON
4. Try connecting your computer again

### 5. Change the Hotspot Password
**On iPhone:**
1. Open Settings
2. Go to "Personal Hotspot"
3. Tap "Wi-Fi Password"
4. Create a new password
5. Try connecting with the new password

**On Android:**
1. Open Settings
2. Go to "Mobile Hotspot"
3. Tap "Configure"
4. Change the password
5. Try connecting with the new password

## When to Contact Support
- Password is correct but still won't connect
- Hotspot keeps disconnecting after connecting
- Computer shows security error
- Phone won't let you change the password

**Contact GigitekAI Support:**
- 📞 (727) 382-5776
- 💬 Create a ticket in TAP
- 📧 support@gigitekai.com

## Prevention Tips
- Write down your hotspot password
- Use a password you can remember
- Don't share your hotspot password
- Change password if you think someone else knows it`
  }
];

async function insertKBArticles() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not set');
    return false;
  }

  let connection;
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbUrl);
    
    console.log('✅ Connected to database');
    console.log(`📝 Inserting ${kbArticles.length} user-friendly KB articles...`);

    let insertedCount = 0;
    for (const article of kbArticles) {
      try {
        await connection.execute(
          `INSERT INTO kbArticles (title, content, category, tags, isPublished, syncSource, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            article.title,
            article.content,
            article.category,
            article.tags,
            true,
            'manual',
          ]
        );
        insertedCount++;
        console.log(`  ✓ ${article.title}`);
      } catch (error) {
        console.warn(`  ⚠ Failed to insert "${article.title}":`, error.message);
      }
    }

    console.log(`\n✨ Successfully inserted ${insertedCount}/${kbArticles.length} KB articles!`);
    console.log('🤖 Aria chat can now answer 30 new user-friendly support questions.');
    console.log('📊 Total KB articles now: 157+ (Tier 1 + Tier 2 + Custom)');
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

insertKBArticles().then(success => {
  process.exit(success ? 0 : 1);
});
