# WebSocket & Real-Time Notifications

Real-time updates for field health, recommendations, and yield predictions using Socket.IO.

---

## 🚀 Quick Start

### 1. Setup WebSocket Connection

```typescript
import { websocketService } from "@/shared/services/websocket";
import { getAuthToken } from "@/shared/api/httpClient";

// Connect on app startup (after authentication)
const token = getAuthToken();
if (token) {
  await websocketService.connect(token);
}

// Disconnect on logout
websocketService.disconnect();
```

### 2. Subscribe to Field Updates

```typescript
import { useWebSocket } from '@/shared/hooks/useWebSocket';

const FieldDetailPage = ({ fieldId }: { fieldId: string }) => {
  const { subscribeToField, unsubscribeFromField } = useWebSocket({
    onHealthUpdated: (data) => {
      console.log('Health updated:', data);
      // Refetch health data or update state
    },
    onRecommendationCreated: (data) => {
      console.log('New recommendation:', data);
      // Show notification or update UI
    },
    showToasts: true, // Auto-show toast notifications
  });

  useEffect(() => {
    subscribeToField(fieldId);
    return () => unsubscribeFromField(fieldId);
  }, [fieldId]);

  return <div>Field Details</div>;
};
```

### 3. Display Notification Bell

```typescript
import { NotificationBell } from '@/shared/components/NotificationBell';
import { useNotifications } from '@/shared/context/NotificationsContext';

const Header = () => {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();

  return (
    <header>
      <NotificationBell
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onClearAll={clearAll}
        onNotificationClick={(notification) => {
          // Navigate to field or open details
          console.log('Clicked:', notification);
        }}
      />
    </header>
  );
};
```

---

## 📡 WebSocket Service

### Methods

#### `connect(token: string): Promise<void>`

Connect to WebSocket server with JWT authentication.

```typescript
await websocketService.connect("your-jwt-token");
```

#### `disconnect(): void`

Disconnect from WebSocket server.

```typescript
websocketService.disconnect();
```

#### `subscribeToField(fieldId: string): void`

Subscribe to real-time updates for a specific field.

```typescript
websocketService.subscribeToField("field-123");
```

#### `unsubscribeFromField(fieldId: string): void`

Unsubscribe from field updates.

```typescript
websocketService.unsubscribeFromField("field-123");
```

#### `on(event: string, callback: Function): void`

Register event listener.

```typescript
websocketService.on("health_updated", (data) => {
  console.log("Health updated:", data);
});
```

#### `off(event: string, callback: Function): void`

Unregister event listener.

```typescript
const handler = (data) => console.log(data);
websocketService.on("health_updated", handler);
websocketService.off("health_updated", handler);
```

#### `isConnected(): boolean`

Check if WebSocket is connected.

```typescript
if (websocketService.isConnected()) {
  console.log("Connected to real-time updates");
}
```

---

## 📨 Events

### Server → Client Events

#### `health_updated`

Emitted when field health analysis completes.

**Payload:**

```typescript
{
  fieldId: string;
  fieldName: string;
  health: {
    score: number;
    status: "excellent" | "good" | "fair" | "poor" | "critical";
    date: string;
  }
  trend: "improving" | "declining" | "stable";
  anomalyCount: number;
  timestamp: number;
}
```

#### `health_alert`

Emitted when critical health issues or anomalies detected.

**Payload:**

```typescript
{
  fieldId: string;
  fieldName: string;
  severity: "critical" | "warning";
  message: string;
  anomalies: Array<{ date: string; severity: string }>;
  timestamp: number;
}
```

#### `recommendations_updated`

Emitted when recommendations are generated for a field.

**Payload:**

```typescript
{
  fieldId: string;
  fieldName: string;
  totalCount: number;
  criticalCount: number;
  highCount: number;
  timestamp: number;
}
```

#### `recommendation_created`

Emitted when critical/high priority recommendations created.

**Payload:**

```typescript
{
  fieldId: string;
  fieldName: string;
  message: string;
  recommendations: Array<{
    id: string;
    type: string;
    priority: string;
    title: string;
  }>;
  timestamp: number;
}
```

#### `yield_prediction_ready`

Emitted when yield prediction completes.

**Payload:**

```typescript
{
  fieldId: string;
  fieldName: string;
  message: string;
  predictionId?: string;
  predictedYieldPerHa?: number;
  expectedRevenue?: number;
  timestamp: number;
}
```

#### `connect`

Emitted when WebSocket connects.

#### `disconnect`

Emitted when WebSocket disconnects.

**Payload:**

```typescript
{
  reason: string;
}
```

#### `connect_error`

Emitted on connection errors.

**Payload:**

```typescript
{
  error: Error;
}
```

### Client → Server Events

#### `subscribe_field`

Subscribe to field updates.

```typescript
socket.emit("subscribe_field", "field-123");
```

#### `unsubscribe_field`

Unsubscribe from field updates.

```typescript
socket.emit("unsubscribe_field", "field-123");
```

---

## 🎣 React Hook: `useWebSocket`

Simplifies WebSocket integration in React components.

### Parameters

```typescript
interface UseWebSocketOptions {
  onHealthUpdated?: (data: any) => void;
  onHealthAlert?: (data: any) => void;
  onRecommendationsUpdated?: (data: any) => void;
  onRecommendationCreated?: (data: any) => void;
  onYieldPredictionReady?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
  showToasts?: boolean; // Auto-show toast notifications
}
```

### Returns

```typescript
{
  subscribeToField: (fieldId: string) => void;
  unsubscribeFromField: (fieldId: string) => void;
  isConnected: () => boolean;
}
```

### Example

```typescript
const { subscribeToField, unsubscribeFromField } = useWebSocket({
  onHealthUpdated: (data) => {
    // Update UI with new health data
    refetchHealthData();
  },
  onRecommendationCreated: (data) => {
    // Show notification
    showToast({
      title: "New Recommendations",
      description: data.message,
    });
  },
  showToasts: true, // Auto-show toasts for all events
});
```

---

## 🔔 Notifications

### NotificationBell Component

Displays notification bell icon with unread count badge and dropdown.

```typescript
<NotificationBell
  notifications={notifications}
  onMarkAsRead={(id) => markAsRead(id)}
  onMarkAllAsRead={() => markAllAsRead()}
  onClearAll={() => clearAll()}
  onNotificationClick={(notification) => {
    // Handle click (navigate, open modal, etc.)
  }}
/>
```

### NotificationsProvider

Context provider for managing notification state.

```typescript
// In App.tsx or root component
import { NotificationsProvider } from '@/shared/context/NotificationsContext';

<NotificationsProvider>
  <YourApp />
</NotificationsProvider>
```

### useNotifications Hook

Access notification state and actions.

```typescript
import { useNotifications } from "@/shared/context/NotificationsContext";

const {
  notifications,
  unreadCount,
  addNotification,
  markAsRead,
  markAllAsRead,
  clearAll,
} = useNotifications();
```

---

## 🎨 Notification Types

| Type             | Icon        | Color | Usage                |
| ---------------- | ----------- | ----- | -------------------- |
| `health`         | Activity    | Red   | Field health updates |
| `alert`          | AlertCircle | Red   | Critical alerts      |
| `recommendation` | Bell        | Blue  | New recommendations  |
| `yield`          | TrendingUp  | Green | Yield predictions    |
| `system`         | AlertCircle | Gray  | System messages      |
| `info`           | AlertCircle | Gray  | General info         |

---

## 🔒 Security

- **JWT Authentication**: All WebSocket connections authenticated via JWT
- **User Isolation**: Users only receive their own notifications
- **Field Authorization**: Subscription to field rooms (future: verify ownership)

---

## ⚡ Auto-Reconnection

WebSocket service automatically reconnects on:

- Network disconnection
- Server restart
- Connection timeout

**Settings:**

- Max reconnect attempts: 5
- Reconnect delay: 1-5 seconds (exponential backoff)
- Auto-resubscribe to fields after reconnection

---

## 🧪 Testing

```typescript
// Mock WebSocket in tests
jest.mock("@/shared/services/websocket", () => ({
  websocketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribeToField: jest.fn(),
    unsubscribeFromField: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    isConnected: jest.fn(() => true),
  },
}));
```

---

## 📱 Mobile Implementation

Similar implementation exists in `mobile/src/services/websocket.ts` with Redux integration.

**Key Differences:**

- Uses Redux for state management (not React Context)
- Integrates with React Native push notifications
- Supports background connection management

---

## 🚧 Troubleshooting

### WebSocket not connecting

1. Check authentication token is valid
2. Verify API_URL is correct
3. Check CORS settings on backend
4. Ensure Socket.IO server is running

```typescript
// Debug connection
websocketService.on("connect", () => {
  console.log("WebSocket connected!");
});

websocketService.on("connect_error", (data) => {
  console.error("Connection error:", data.error);
});
```

### Events not received

1. Check if subscribed to field: `subscribeToField(fieldId)`
2. Verify event listener is registered: `websocketService.on('event_name', handler)`
3. Check browser console for WebSocket logs
4. Ensure backend service is emitting events

### Notifications not appearing

1. Verify NotificationsProvider wraps app
2. Check useNotifications hook is called within provider
3. Ensure WebSocket events are triggering addNotification
4. Check browser console for errors

---

**Status**: ✅ Complete (Sprint 4, Phase 5, Tasks 5.2 & 5.3)  
**Last Updated**: November 21, 2025
