// Functions/DemoData.cs
// Default data shown when Cosmos DB is unavailable or demo mode is active.
// This ensures the website always looks great for presentations.

using SaintLouisvilleApi.Models;

namespace SaintLouisvilleApi.Functions;

public static class DemoData
{
    public static List<Official> Officials =>
    [
        new() { Id = "1", Name = "Zack Allen", Title = "Mayor", Order = 0,
            Email = "mayor@saintlouisvilleohio.gov",
            Bio = "Mayor Zack Allen has served the Village of Saint Louisville with dedication, focusing on infrastructure improvements, community engagement, and maintaining the small-town character that makes our village special." },
        new() { Id = "2", Name = "Council Member", Title = "Village Council", Order = 1,
            Email = "council1@saintlouisvilleohio.gov",
            Bio = "Dedicated to representing the interests of all Saint Louisville residents on matters of zoning, public safety, and community development." },
        new() { Id = "3", Name = "Council Member", Title = "Village Council", Order = 2,
            Email = "council2@saintlouisvilleohio.gov",
            Bio = "Committed to fiscal responsibility and transparent governance for the Village and its residents." },
        new() { Id = "4", Name = "Council Member", Title = "Village Council", Order = 3,
            Email = "council3@saintlouisvilleohio.gov",
            Bio = "Focused on community growth, parks, and maintaining the small-town character that makes Saint Louisville special." },
        new() { Id = "5", Name = "Council Member", Title = "Village Council", Order = 4,
            Email = "council4@saintlouisvilleohio.gov",
            Bio = "Advocate for local businesses and economic development within the Village and surrounding region." },
        new() { Id = "6", Name = "Council Member", Title = "Village Council", Order = 5,
            Email = "council5@saintlouisvilleohio.gov",
            Bio = "Long-time resident passionate about preserving the history and heritage of Saint Louisville for future generations." },
        new() { Id = "7", Name = "George Kerber", Title = "Tech Czar", Order = 6,
            Email = "tech@saintlouisvilleohio.gov",
            Bio = "George oversees the Village's technology initiatives, digital infrastructure, and online services — including this website." },
    ];

    public static List<Bulletin> Bulletins =>
    [
        new() { Id = "b1", Category = "urgent", Pinned = true,
            Date = DateTime.UtcNow.AddDays(-1).ToString("o"),
            Title = "Welcome to the New Village Website!",
            Body = "We are proud to launch the new official website for the Village of Saint Louisville. You can now find council minutes, ordinances, event information, and pay your water bill online — all in one place." },
        new() { Id = "b2", Category = "event", Pinned = false,
            Date = DateTime.UtcNow.AddDays(-3).ToString("o"),
            Title = "Community Clean-Up Day — Saturday",
            Body = "Join your neighbors for our annual village clean-up! Meet at Village Hall at 9 AM. Gloves and bags provided. Light refreshments served. All ages welcome. Let's keep Saint Louisville beautiful!",
            Link = "/calendar" },
        new() { Id = "b3", Category = "notice", Pinned = false,
            Date = DateTime.UtcNow.AddDays(-7).ToString("o"),
            Title = "Next Regular Council Meeting",
            Body = "The next regular meeting of the Village Council will be held at Village Hall. All residents are welcome and encouraged to attend. See the calendar for the exact date and time." },
        new() { Id = "b4", Category = "notice", Pinned = false,
            Date = DateTime.UtcNow.AddDays(-14).ToString("o"),
            Title = "Water System Maintenance Scheduled",
            Body = "Routine maintenance on the village water system is scheduled for next week. Residents may experience brief service interruptions. We apologize for any inconvenience and appreciate your patience." },
    ];

    public static List<Minutes> Minutes =>
    [
        new() { Id = "m1", Year = 2025, MeetingDate = new DateTime(2025, 3, 15).ToString("o"),
            Title = "March 15, 2025 Council Meeting", Type = "Regular Session", Approved = true },
        new() { Id = "m2", Year = 2025, MeetingDate = new DateTime(2025, 2, 17).ToString("o"),
            Title = "February 17, 2025 Council Meeting", Type = "Regular Session", Approved = true },
        new() { Id = "m3", Year = 2025, MeetingDate = new DateTime(2025, 1, 20).ToString("o"),
            Title = "January 20, 2025 Council Meeting", Type = "Regular Session", Approved = true },
        new() { Id = "m4", Year = 2024, MeetingDate = new DateTime(2024, 12, 16).ToString("o"),
            Title = "December 16, 2024 Council Meeting", Type = "Regular Session", Approved = true },
        new() { Id = "m5", Year = 2024, MeetingDate = new DateTime(2024, 11, 18).ToString("o"),
            Title = "November 18, 2024 Council Meeting", Type = "Regular Session", Approved = true },
    ];

    public static List<Ordinance> Ordinances =>
    [
        new() { Id = "o1", Number = "ORD-2024-001", Category = "zoning", Year = 2024,
            Title = "Residential Setback Requirements — R-1 District",
            Summary = "Establishes minimum front, rear, and side setback requirements for residential structures in the R-1 zoning district." },
        new() { Id = "o2", Number = "ORD-2024-002", Category = "general", Year = 2024,
            Title = "Nuisance Vegetation and Grass Height",
            Summary = "Defines maximum allowable grass and vegetation height and procedures for abatement of nuisance conditions." },
        new() { Id = "o3", Number = "ORD-2023-012", Category = "utilities", Year = 2023,
            Title = "Water Service Connection Fees",
            Summary = "Establishes connection fees and deposit requirements for new water service accounts." },
        new() { Id = "o4", Number = "ORD-2023-008", Category = "traffic", Year = 2023,
            Title = "Speed Limits on Village Roads",
            Summary = "Establishes and updates speed limits on designated village streets and roads." },
        new() { Id = "o5", Number = "ORD-2022-005", Category = "health", Year = 2022,
            Title = "Solid Waste and Recycling Collection",
            Summary = "Regulates solid waste disposal, recycling requirements, and collection schedules within village limits." },
    ];

    public static List<CalendarEvent> Events =>
    [
        new() { Id = "e1", Title = "Regular Council Meeting",
            Date = DateTime.UtcNow.AddDays(7).ToString("o"),
            Month = DateTime.UtcNow.AddDays(7).ToString("yyyy-MM"),
            Time = "7:00 PM", Location = "Village Hall",
            Description = "Monthly regular meeting of the Saint Louisville Village Council. All residents welcome." },
        new() { Id = "e2", Title = "Community Clean-Up Day",
            Date = DateTime.UtcNow.AddDays(12).ToString("o"),
            Month = DateTime.UtcNow.AddDays(12).ToString("yyyy-MM"),
            Time = "9:00 AM", Location = "Village Hall (meet here)",
            Description = "Annual village-wide clean-up. Gloves and bags provided. Light refreshments available." },
        new() { Id = "e3", Title = "Zoning Board Meeting",
            Date = DateTime.UtcNow.AddDays(21).ToString("o"),
            Month = DateTime.UtcNow.AddDays(21).ToString("yyyy-MM"),
            Time = "6:30 PM", Location = "Village Hall",
            Description = "Regular meeting of the Zoning and Planning Board." },
    ];

    public static List<Photo> Photos =>
        Enumerable.Range(1, 8).Select(i => new Photo
        {
            Id = $"p{i}",
            Caption = new[] {
                "Village Hall, early days",
                "Main Street looking north",
                "Community gathering at the park",
                "Church and schoolhouse, circa 1902",
                "Founding families reunion",
                "Harvest festival on Main Street",
                "Village water tower",
                "Railroad depot, Saint Louisville"
            }[i - 1],
            Year = new[] { 1910, 1925, 1938, 1902, 1955, 1948, 1965, 1920 }[i - 1],
            Url = $"https://placehold.co/400x400/1e3a8a/white?text=Historic+Photo+{i}"
        }).ToList();

    public static string HistoryText =>
        "Saint Louisville was established in 1833 in Licking County, Ohio, as a small but proud community in the heart of the state. Named after Saint Louis, Missouri, our village grew alongside the rich agricultural traditions of central Ohio. Through more than 190 years of history, Saint Louisville has maintained its close-knit character, welcoming generations of families who have called this special place home. Today we honor that heritage while looking forward to a bright future for our community.";
}
