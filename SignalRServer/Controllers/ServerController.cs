using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using SignalRServer.Hubs;
using System.Diagnostics;

namespace SignalRServer.Controllers;

[ApiController]
[Route("api/signalr")]
public class SignalRManagementController : ControllerBase
{
    private readonly IHubContext<ChatHub> _hubContext;
    private static readonly Random _random = new();
    
    private static readonly string[] _randomMessages = {
        "🚀 System update: New features deployed!",
        "📢 Announcement: Server maintenance completed successfully",
        "⚡ Performance boost: Connection optimized",
        "🔔 Notification: New user milestone reached",
        "🎉 Celebration: 100 active connections!",
        "📊 Stats update: Processing 1000+ messages/minute",
        "🛡️ Security alert: All systems secure",
        "🌟 Feature spotlight: Real-time collaboration enabled",
        "📈 Growth update: User engagement at all-time high",
        "🔧 Technical note: Load balancing optimized"
    };

    public SignalRManagementController(IHubContext<ChatHub> hubContext)
    {
        _hubContext = hubContext;
    }

    [HttpGet("health")]
    public IActionResult GetHealthStatus()
    {
        return Ok(new
        {
            Status = "Healthy",
            ServerType = "SignalR Hub Server",
            Timestamp = DateTime.UtcNow,
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
            Version = "1.0.0"
        });
    }

    [HttpPost("messages/broadcast")]
    public async Task<IActionResult> BroadcastMessage([FromBody] BroadcastRequest request)
    {
        var message = string.IsNullOrEmpty(request.Message) ? GetRandomMessage() : request.Message;
        await _hubContext.Clients.All.SendAsync("ReceiveMessage", "🤖 System Bot", message);
        
        return Ok(new { 
            Message = "Broadcast sent successfully",
            Content = message,
            Recipients = "All connected clients",
            Timestamp = DateTime.UtcNow
        });
    }

    [HttpPost("messages/broadcast/random")]
    public async Task<IActionResult> BroadcastRandomMessage()
    {
        var randomMessage = GetRandomMessage();
        await _hubContext.Clients.All.SendAsync("ReceiveMessage", "🎲 Random Bot", randomMessage);
        
        return Ok(new { 
            Message = "Random broadcast sent successfully",
            Content = randomMessage,
            Recipients = "All connected clients",
            Timestamp = DateTime.UtcNow
        });
    }

    [HttpPost("groups/{groupName}/broadcast")]
    public async Task<IActionResult> BroadcastToGroup(string groupName, [FromBody] BroadcastRequest request)
    {
        var message = string.IsNullOrEmpty(request.Message) ? GetRandomMessage() : request.Message;
        await _hubContext.Clients.Group(groupName).SendAsync("ReceiveMessage", $"🏷️ Group Bot [{groupName}]", message);
        
        return Ok(new { 
            Message = $"Group broadcast sent successfully",
            Content = message,
            GroupName = groupName,
            Timestamp = DateTime.UtcNow
        });
    }

    [HttpPost("groups/{groupName}/broadcast/random")]
    public async Task<IActionResult> BroadcastRandomToGroup(string groupName)
    {
        var randomMessage = GetRandomMessage();
        await _hubContext.Clients.Group(groupName).SendAsync("ReceiveMessage", $"🎯 Group Random Bot [{groupName}]", randomMessage);
        
        return Ok(new { 
            Message = $"Random group broadcast sent successfully",
            Content = randomMessage,
            GroupName = groupName,
            Timestamp = DateTime.UtcNow
        });
    }

    [HttpGet("analytics/overview")]
    public IActionResult GetAnalyticsOverview()
    {
        return Ok(new
        {
            ServerInfo = new {
                Type = "SignalR Hub Server",
                Status = "Active",
                Uptime = DateTime.UtcNow.Subtract(Process.GetCurrentProcess().StartTime).ToString(@"dd\.hh\:mm\:ss")
            },
            Capabilities = new[] {
                "Real-time messaging",
                "Group broadcasting",
                "Connection management",
                "Random message generation"
            },
            Endpoints = new {
                Health = "/api/signalr/health",
                Broadcast = "/api/signalr/messages/broadcast",
                RandomBroadcast = "/api/signalr/messages/broadcast/random",
                GroupBroadcast = "/api/signalr/groups/{groupName}/broadcast"
            }
        });
    }

    private static string GetRandomMessage()
    {
        return _randomMessages[_random.Next(_randomMessages.Length)];
    }
}

public record BroadcastRequest(string Message);
public record GroupBroadcastRequest(string GroupName, string Message);