using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using SignalRServer.Hubs;

namespace SignalRServer.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServerController : ControllerBase
{
    private readonly IHubContext<ChatHub> _hubContext;

    public ServerController(IHubContext<ChatHub> hubContext)
    {
        _hubContext = hubContext;
    }

    [HttpGet("status")]
    public IActionResult GetServerStatus()
    {
        return Ok(new
        {
            Status = "Running",
            ServerType = "Single Server",
            Timestamp = DateTime.UtcNow,
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"
        });
    }

    [HttpPost("broadcast")]
    public async Task<IActionResult> BroadcastMessage([FromBody] BroadcastRequest request)
    {
        await _hubContext.Clients.All.SendAsync("ReceiveMessage", "Server", request.Message);
        return Ok(new { Message = "Message broadcasted successfully" });
    }

    [HttpPost("broadcast-to-group")]
    public async Task<IActionResult> BroadcastToGroup([FromBody] GroupBroadcastRequest request)
    {
        await _hubContext.Clients.Group(request.GroupName).SendAsync("ReceiveMessage", "Server", request.Message);
        return Ok(new { Message = $"Message broadcasted to group '{request.GroupName}' successfully" });
    }

    [HttpGet("connections")]
    public IActionResult GetConnectionInfo()
    {
        return Ok(new
        {
            Message = "Connection count not available in single server mode without additional tracking",
            ServerType = "Single Server Instance"
        });
    }
}

public record BroadcastRequest(string Message);
public record GroupBroadcastRequest(string GroupName, string Message);