---
title: My System for Organizing Work in a Distracted World
categories: ["Simplify"]
date: 2020-03-22T05:00:00
modified: 2020-03-22T05:00:00
authors: [tom]
excerpt: "A peek into the system I use to organize my workday."
image: images/stock/0067-todo-1200x628-branded.jpg
url: organizing-work
---

As knowledge workers, we software developers are very vulnerable to distractions. Have you counted the number of context switches you've had today? 

I'm always on the hunt for the perfect method to organize my daily work. While I don't think I have reached perfection (or ever will, for that matter), I'm pretty satisfied with my current system, which I explain in this article. 

Hopefully, you'll find bits and pieces of it useful for managing your own work.

## Challenges in Our Work Day

A lot is going on in a workday, especially when working in a team. Before looking at a solution, let's discuss some of the challenging we're having. 

### Distractions

Have you counted how often you are interrupted on a regular workday? A teammate asking a question, a meeting, or a butterfly flying past the window. Everything has the potential to distract us from the work we're currently doing.

Working from home in the current COVID-19 pandemic, I'm especially distracted. My kids wanting attention, a Slack message I just couldn't ignore, or thinking about my supply of toilet paper and the money I invested in stocks just before the crash.

I can try very hard to resist these interruptions, and I'm sometimes successful, but I found that resistance is futile in most cases.

### Asynchronicity

Software development is often inherently asynchronous (except if you're practicing pair programming or mob programming for most of the day, which I usually don't).

A workflow often looks like this: 

* We're coding a little and create a pull request. 
* A teammate reviews the pull request at their own pace and leaves some comments. 
* When we're free again, we review the comments and action them, passing the pull request back to the teammate for approval.
* ... and so on. 

Or maybe someone asks a question in Slack which we want to answer, but not right now. We tell them we'll get back to them.  

In a remote working situation, we're usually working even more asynchronously than in the office. We can't just tap a teammate on the shoulder to resolve an issue on the spot (actually, with chat tools, we can, but we tend not to). Instead, we post a question and wait for the answer. When the answer comes, we're switching contexts.

### Forgetting Stuff

Distractions and asynchronicity both lead to context switching. Like an operating system switches between processes, we're switching between tasks. An operating system has access to multiple processor cores which can each work on one process at a time. **We have only one core**. 

Context switching leads to forgetting stuff. When a distraction comes our way, we have to decide to either continue working on the task we've been working on or to divert our attention to the distraction. We can't do both at once. We might forget the things we're not currently paying attention to. 

If a teammate asked a question while I was busy and I said I'd come back to them later, chances are that I would forget. Personally, I'm utterly bad at remembering stuff. 

I don't trust my brain to remember things, especially while I'm busy with other stuff. If you can do that, you have my respect :).

### Anxiety

If I can't trust myself to remember stuff, I get anxious. I get a nagging feeling that there was something I wanted to do but I don't remember what.

Or worse, I know exactly what I need to do the next day and keep thinking of it through the night, even though I would really like to sleep. 

I've had a pretty bad case of such anxiety in a software project early in my career when I was first given technical responsibility for a 5-person-years project. I couldn't sleep and eat. Had it gone on for longer than it did, it would have ended in burnout.   

To reduce anxiety, it helps to have an external memory aid where we can put ideas and tasks and be sure that it's still there the next day. 

## My System for Organizing Work

Distractions and Asynchronicity lead to context switching. Context switching leads to forgetting stuff and anxiety. Anxiety leads to suffering ... you get the idea.

So we need a system for capturing our work. We need to trust this system to remind us what's important and lead us through the day. 

My system is a visual board, using Trello as a tool. It has one column for each day of the workweek (i.e. Monday through Friday) and one column for "Next week":

{{% image alt="The board I use for organizing work" src="images/posts/organizing-work/board.png" %}}

**It's not a Kanban or Scrum board**! The columns don't represent a status. It's more like a calendar that I can use to organize my work day.

Having a board like that in place, we "just" need to build some habits around it. 

Here's what I'm doing with the board.

### Plan the Week on Monday Morning

On Monday morning, I take some time to organize my board for the upcoming week. 

I copy the board from last week into a new one. I go through all the columns and remove the tasks marked with "done". Then, I look through all the tasks that are left and decide what I want to tackle in the upcoming week (most of these will come from the "next week" column, where they might have waited for a couple of weeks).

Next, I distribute the tasks I want to tackle over the work days. Usually, not more than 2-3 tasks per day, to leave room for unexpected work (which always comes).

From this habit, **I get a sense of security that I haven't forgotten anything important over the weekend**. 

### Bookmark the Board

I have a bookmark to my board in my browser's bookmark bar. Every week, I update that bookmark to link to the new board. 

**This way, the board is always very easily accessible**. 

That's important when I quickly want to note something that I would otherwise forget.

### Write a Card for Everything

I find that it helps my mental health tremendously to note down stuff as soon as I learn of it. I just don't trust my brain to remember things.

So, I add a card to the board for just about everything as soon as I think of it: 

* talk to a teammate about the breaking build, 
* expense the WFH equipment I bought, or
* work on that task from the sprint backlog. 

During meetings I add a card for each action I take from the meeting so I don't forget.

If I have to follow up with someone from an asynchronous communication (like an email or an interrupted Slack chat), I create a card for it. 

I pretty much create a card for everything, so I'm sure it's in my trusted system (and not in my untrustworthy brain).

### Mark Tasks as Done

When I'm done with a task, I label it as "done". Labels in Trello are colored, so I can quickly see what I've achieved in a day. 

Like many teams, we do a daily standup meeting to catch up with each other (currently, we do this remotely). Before the standup, I refresh my brain and look at the "done" tasks from yesterday and the planned tasks from tomorrow on the board. 

Marking tasks as "done" is satisfying and helps in remembering the things I've done. If I need to research something, I can even look up the "done" tasks from 3 weeks ago in that week's version of the board.

### Batch Similar Work Items

Sometimes I use labels to mark tasks of a certain type. Some tasks are coding, some tasks are talking to people, some tasks are reading. 

When I plan my day or week, I can then group similar tasks. This way, I can plan an hour of uninterrupted reading, for example, ignoring Slack and emails for this time. Or I can resolve some of my asynchronous communications. Or do some serious coding for an hour or two (this is my favorite, by the way).

Batching similar tasks helps to reduce context switches and to generate a feeling of "flow". After having done a batch of tasks, it's especially satisfying to mark them as "done" on the board.

### Plan the Next Day In the Evening

At the end of a work day, I take a minute to take stock of today and to plan the next day. 

Did I mark all the tasks I finished as "done" on the board? If not, I do it now.

Which tasks are left over from today that need attention tomorrow? I move those tasks to the next day on the board.

Are there tasks that weren't that urgent after all? I move them to the "next week" column.

Are there tasks that turned out to be unnecessary? I label those as "abandoned". 

With my next working day roughly planned, I know that I can go back to my system tomorrow and continue where I left off. **I can sleep well tonight**.  

### Groom the Backlog

Using the system as outlined above will lead to an overflowing "next week" column sooner rather than later. All the tasks that weren't so urgent are dumped there, added up over several weeks. 

So, every once in a while, I have a "Rendezvous with myself" where I go through the "next week" column and decide on each task whether to keep it in the system or flush it.  

Ideally, I do this every week, but I'm still struggling to build that habit.

## Conclusion

There are certainly more habits to build around a system like this to organize work, but the above is a report of what I'm currently doing with it. Hopefully, some of it sparks ideas for your own system of managing work. 

The system gives me security that I don't forget anything, protecting my mental health. 

**It's easy to start, satisfying to work with, and it provides daily and weekly triggers to engage with it** - three important factors for creating habits. Which doesn't mean that I'm not struggling now and then.

What are you doing to organize your work? I'm curious to know. Let me know in the comments!

## Further Reading

Some of the ideas behind the system outlined in this article come from books, which you can read up on in my book reviews:

* [The Power of Habit](/book-review-the-power-of-habit/)
* [Atomic Habits](/book-review-atomic-habits/)
* [Deep Work](/book-review-deep-work/)
* [Everybody Writes](/book-review-everybody-writes/)















