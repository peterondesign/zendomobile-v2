import SwiftUI

struct ContentView: View {
    @State private var tasks = sampleTasks

    private var todayTasks: [TaskItem] {
        tasks.filter { $0.isToday }
    }

    private var upcomingTasks: [TaskItem] {
        tasks.filter { !$0.isToday }
    }

    private var completedCount: Int {
        tasks.filter { $0.isDone }.count
    }

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    headerCard

                    Text("Today")
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(.primary)

                    ForEach(todayTasks) { task in
                        taskRow(task)
                    }

                    Text("Upcoming")
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(.primary)
                        .padding(.top, 6)

                    ForEach(upcomingTasks) { task in
                        taskRow(task)
                    }
                }
                .padding(20)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("My Tasks")
        }
    }

    private var headerCard: some View {
        HStack {
            VStack(alignment: .leading, spacing: 6) {
                Text("Today’s progress")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.8))

                Text("\(completedCount)/\(tasks.count) done")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(.white)
            }

            Spacer()

            Text("Simple")
                .font(.caption.weight(.bold))
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color.blue)
                .foregroundStyle(.white)
                .clipShape(Capsule())
        }
        .padding(18)
        .background(
            LinearGradient(
                colors: [Color.black.opacity(0.9), Color.blue.opacity(0.85)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
    }

    private func taskRow(_ task: TaskItem) -> some View {
        Button {
            toggleTask(task)
        } label: {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: task.isDone ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(task.isDone ? .green : .gray)
                    .padding(.top, 2)

                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(task.title)
                            .font(.headline)
                            .foregroundStyle(.primary)
                            .strikethrough(task.isDone)

                        Spacer(minLength: 8)

                        Text(task.category)
                            .font(.caption.weight(.semibold))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color.blue.opacity(0.12))
                            .foregroundStyle(.blue)
                            .clipShape(Capsule())
                    }

                    Text(task.note)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.leading)

                    Text(task.time)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.blue)
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private func toggleTask(_ task: TaskItem) {
        guard let index = tasks.firstIndex(where: { $0.id == task.id }) else { return }
        tasks[index].isDone.toggle()
    }
}

#Preview {
    ContentView()
}
