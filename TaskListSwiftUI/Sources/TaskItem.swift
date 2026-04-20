import Foundation

struct TaskItem: Identifiable {
    let id = UUID()
    let title: String
    let note: String
    let time: String
    let category: String
    var isDone: Bool
    let isToday: Bool
}

let sampleTasks: [TaskItem] = [
    TaskItem(
        title: "Plan sprint boardss",
        note: "Review the top 3 engineering priorities",
        time: "9:00 AM",
        category: "Work",
        isDone: true,
        isToday: true
    ),
    TaskItem(
        title: "Pick up groceries",
        note: "Fruit, yogurt, and coffee beans",
        time: "1:30 PM",
        category: "Home",
        isDone: false,
        isToday: true
    ),
    TaskItem(
        title: "Evening walk",
        note: "30 minutes around the neighborhood",
        time: "6:15 PM",
        category: "Health",
        isDone: false,
        isToday: true
    ),
    TaskItem(
        title: "Call family",
        note: "Quick check-in after dinner",
        time: "Tomorrow · 7:00 PM",
        category: "Personal",
        isDone: false,
        isToday: false
    )
]
