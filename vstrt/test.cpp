#include <atomic>
#include <chrono>
#include <future>
#include <iostream>
#include <thread>
#include <concepts>
using namespace std::literals;
 
int main()
{
    std::atomic<bool> all_tasks_completed{false};
    std::atomic<unsigned> completion_count{};
    std::future<void> task_futures[16];
    std::atomic<unsigned> outstanding_task_count{16};
 
    // Spawn several tasks which take different amounts of
    // time, then decrement the outstanding task count.
    for (std::future<void>& task_future : task_futures)
        task_future = std::async([&]
        {
            // This sleep represents doing real work...
            std::this_thread::sleep_for(50ms);
 
            ++completion_count;
            --outstanding_task_count;
 
            // When the task count falls to zero, notify
            // the waiter (main thread in this case).
            if (outstanding_task_count.load() == 0)
            {
                all_tasks_completed = true;
                all_tasks_completed.notify_one();
            }
        });
 
    all_tasks_completed.wait(false);
 
    std::cout << "Tasks completed = " << completion_count.load() << '\n';
}