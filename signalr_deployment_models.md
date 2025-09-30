# SignalR Deployment Models

## Differences

| Aspect                | Single Server                                   | Multi-Server (with Backplane)                           | Azure SignalR Service                          |
|------------------------|------------------------------------------------|---------------------------------------------------------|------------------------------------------------|
| **Architecture**       | One server handles all client connections.     | Multiple servers share load, coordinated by a backplane.| Azure manages all client connections; servers just push events. |
| **Connection Storage** | Connections kept in server memory.             | Connections distributed across servers, synced via backplane. | Connections offloaded to Azure service. |
| **Scalability**        | Limited to capacity of one server.             | Horizontally scalable with multiple servers.            | Virtually unlimited scalability (cloud managed). |
| **Fault Tolerance**    | Single point of failure.                       | Redundant — if one server dies, others handle traffic.  | High availability built into Azure service. |
| **Performance**        | Very fast (direct memory lookups).             | Slight latency overhead due to backplane communication. | Slight overhead, but optimized by Azure infra. |
| **Setup Complexity**   | Simple, no extra infrastructure.               | More complex, requires Redis/Azure backplane.           | Easiest in cloud — Azure handles infra. |
| **Best Use Case**      | Small apps, dev, POC.                          | Production apps with many concurrent users.             | Enterprise-grade, cloud-native, millions of clients. |

---

## Mermaid Diagrams

### Single Server
```mermaid
flowchart TB
    subgraph SingleServer["Single Server"]
        S1[Server]
        C1[Client 1]
        C2[Client 2]
        C3[Client 3]

        S1 <--> C1
        S1 <--> C2
        S1 <--> C3
    end
```

---

### Multi-Server with Backplane
```mermaid
flowchart TB
    subgraph MultiServer["Multi-Server with Backplane"]
        S2[Server A]
        S3[Server B]
        BP[(Backplane)]
        C4[Client 1]
        C5[Client 2]
        C6[Client 3]

        S2 <--> C4
        S3 <--> C5
        S3 <--> C6

        S2 <--> BP
        S3 <--> BP
    end
```

---

### Azure SignalR Service
```mermaid
flowchart TB
    subgraph AzureSignalR["Azure SignalR Service"]
        AS[(SignalR Service)]
    end

    App1[App Server A]
    App2[App Server B]

    C7[Client 1]
    C8[Client 2]
    C9[Client 3]

    App1 <--> AS
    App2 <--> AS

    AS <--> C7
    AS <--> C8
    AS <--> C9
```

