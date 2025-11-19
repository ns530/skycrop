# 🔔 Push Notifications - Quick Start Guide

## 🚀 Try It in 30 Seconds!

### **1. Start Dev Server**
```bash
npm run dev
```

### **2. Enable Notifications**
1. Look for 🔔 bell icon in header (top right)
2. Click the bell
3. Click **"Enable Notifications"** button
4. Browser asks permission → Click **"Allow"**
5. See welcome notification! 🎉

### **3. Send Test Notification**
1. Click bell icon again
2. Click **"Notification settings"** at bottom
3. Click **"Send Test Notification"** button
4. See native OS notification pop up!

**Done!** You're now receiving notifications! 🎊

---

## 🔔 **What Notifications Will You Get?**

### **🚨 Health Alerts** (Critical/High)
- Field health declines
- NDVI drops significantly
- Immediate attention needed

**Example:**
```
🚨 Field A Health Alert
Critical: Health declined to poor. NDVI: 0.35
```

### **🌧️ Weather Warnings** (High)
- Heavy rain forecast
- Extreme temperatures
- Flooding risk

**Example:**
```
🌧️ Heavy Rain Warning
Flooding expected tomorrow. Drain field now.
```

### **🤖 AI Recommendations** (Medium)
- New farming advice
- Optimal timing for actions
- Fertilizer/irrigation reminders

**Example:**
```
🤖 Field B - New Recommendation
Apply nitrogen fertilizer within 7 days
```

### **📊 Yield Updates** (Medium)
- Prediction changes
- Harvest timing
- Yield forecasts

**Example:**
```
📊 Yield Prediction Updated
Expected yield increased to 4200 kg/ha
```

---

## ⚙️ **Notification Settings**

Go to `/settings/notifications` or click "Notification settings" in the notification center.

### **Master Switch**
Turn all notifications on/off

### **Notification Types**
Choose which types you want:
- [x] Health Alerts
- [x] Weather Warnings
- [x] AI Recommendations
- [x] Yield Updates
- [x] System Messages
- [ ] General News (off by default)

### **Do Not Disturb**
- Enable DND mode: Only critical notifications
- Set quiet hours: 22:00 - 07:00 (customizable)

### **Sound & Vibration**
- [ ] Play sound
- [x] Vibrate on mobile

---

## 🔥 **Priority Levels**

Notifications have 4 priority levels:

### **🔴 Critical**
- Always shows, even in Do Not Disturb
- Doesn't auto-dismiss
- Requires user interaction
- Sound and vibration (even if disabled)

**When:** Field health critical, severe emergency

### **🟠 High**
- Shows during active hours
- Auto-dismisses after interaction
- Sound and vibration enabled

**When:** Health declining, weather warnings, urgent recommendations

### **🔵 Medium**
- Standard notifications
- Auto-dismisses after 5 seconds
- Normal sound/vibration

**When:** New recommendations, yield updates

### **⚪ Low**
- Silent (no sound/vibration)
- Only shows in Notification Center
- Auto-dismisses immediately

**When:** General updates, system messages

---

## 🔕 **Quiet Hours**

Set when you don't want to be disturbed:

**Default**: 22:00 (10 PM) to 07:00 (7 AM)

**How it works:**
- Non-critical notifications are queued
- Sent when quiet hours end
- Critical notifications **bypass** quiet hours

**Configure in Settings:**
1. Go to `/settings/notifications`
2. Set "Start time" and "End time"
3. Notifications automatically queue during these hours

---

## 📋 **Notification Center**

Click 🔔 bell icon to open:

### **Features:**
- View last 50 notifications
- Unread count badge (red circle)
- Click notification to go to related page
- Mark as read (removes unread dot)
- Dismiss (X button to remove)
- Clear all notifications

### **Actions:**
- **Mark all read** - Clear unread badges
- **Clear all** - Remove all notifications
- **Notification settings** - Go to settings page

---

## 💡 **Pro Tips**

1. **Enable All Types First**
   - Start with everything enabled
   - Disable types you don't want later

2. **Set Quiet Hours**
   - Configure immediately to avoid late-night alerts
   - Critical alerts still get through (for emergencies)

3. **Test It**
   - Use "Send Test Notification" button
   - Verify sound/vibration settings
   - Check browser notification appears

4. **Check Permission**
   - If notifications stop working, check browser settings
   - Reset permission if needed
   - Re-enable in app

5. **Mobile Users**
   - Enable vibration for physical alerts
   - Consider disabling sound in public places
   - Use Do Not Disturb during work

6. **Desktop Users**
   - Keep browser tab open (required for now)
   - Enable sound for alerts when away from desk
   - Pin browser tab to prevent accidental closing

---

## 🆘 **Troubleshooting**

### **Not Receiving Notifications?**

**Check:**
1. Permission granted? → Click bell, request permission
2. Notifications enabled? → Check settings page
3. Notification type enabled? → Check type toggles
4. In quiet hours? → Non-critical notifications queued
5. Browser tab open? → Must be open (for now)

### **Too Many Notifications?**

**Solutions:**
1. Disable specific types (e.g., turn off "General News")
2. Enable Do Not Disturb mode
3. Set quiethours for your schedule
4. Keep only critical and high priority enabled

### **Wrong Browser Notification Settings?**

**Fix:**
1. Go to browser settings
2. Search for "Notifications"
3. Find SkyCrop (localhost:5173)
4. Reset to "Ask" or "Allow"
5. Reload page and re-enable in app

### **Notifications Not Clearing?**

**Fix:**
1. Click "Mark all read" in notification center
2. Or click "Clear all" to remove everything
3. Refresh page if badge doesn't update

---

## 🧪 **For Developers**

### **Send Custom Notification**

```typescript
import { sendNotification } from '@/shared/services/notificationService';

// Simple notification
await sendNotification('Hello!', 'This is a test');

// With options
await sendNotification('Title', 'Body', {
  type: 'system',
  priority: 'medium',
  fieldId: 'field-123',
  url: '/fields/field-123',
});
```

### **Send Health Alert**

```typescript
import { sendHealthAlert } from '@/shared/services/notificationService';

await sendHealthAlert(
  'Field A',           // Field name
  'NDVI dropped',      // Message
  'field-123',         // Field ID
  'critical'           // Priority
);
```

### **Check if Enabled**

```typescript
import { notificationService } from '@/shared/services/notificationService';

const prefs = notificationService.getPreferences();

if (prefs.enabled && prefs.types['health-alert']) {
  // Health alerts are enabled
}
```

### **Monitor Data Changes**

```typescript
import { useNotificationIntegration } from '@/shared/hooks/useNotificationIntegration';

// In component
useNotificationIntegration({
  fieldData: field,
  enableHealthAlerts: true,
  enableWeatherAlerts: true,
  enableRecommendationAlerts: true,
});
```

---

## 📁 **File Structure**

```
frontend/src/
├── shared/
│   ├── services/
│   │   ├── notificationService.ts        # Core service
│   │   └── notificationService.test.ts   # Tests
│   ├── components/
│   │   └── NotificationCenter/
│   │       ├── NotificationBell.tsx      # Bell icon
│   │       ├── NotificationCenter.tsx    # Dropdown
│   │       └── index.ts
│   └── hooks/
│       └── useNotificationIntegration.ts # Auto-triggers
└── features/
    └── settings/
        └── pages/
            └── NotificationSettingsPage.tsx  # Settings UI
```

---

## 📊 **Browser Support**

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Best experience |
| Firefox | ✅ Full | All features work |
| Edge | ✅ Full | Chromium-based |
| Safari | ⚠️ Partial | Limited features |
| Mobile Chrome | ✅ Full | Vibration works |
| Mobile Safari | ⚠️ Partial | iOS restrictions |
| IE 11 | ❌ None | Not supported |

---

## 🎯 **What's Next?**

After setting up notifications:

1. **Test Each Type**
   - Trigger health alert (edit field health)
   - Send weather warning (manually)
   - Generate AI recommendation

2. **Customize Preferences**
   - Disable types you don't want
   - Set your quiet hours
   - Configure sound/vibration

3. **Monitor Your Fields**
   - Let the app alert you
   - No need to check constantly
   - Take action when notified

---

## 📚 **Full Documentation**

See **PUSH_NOTIFICATIONS_SUMMARY.md** for:
- Complete architecture details
- API reference
- Integration guide
- Testing strategy
- Future enhancements

---

## 🎉 **You're All Set!**

Notifications are now keeping you informed in real-time! 🔔

**Remember:**
- 🔴 Critical = Act immediately
- 🟠 High = Act today
- 🔵 Medium = Plan this week
- ⚪ Low = FYI only

**Keep farming smart with SkyCrop!** 🌾✨

---

**Questions?** Check the full documentation or settings page.

**Built with 🔔 for 🌾 Sri Lankan farmers**

