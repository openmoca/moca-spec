---
type: Video
title: 'Microsoft Agent Framework Workflows: From Zero to Hero'
description: 'Microsoft Agent Framework Workflows: From Zero to Hero is a practical developer session that turns familiar workflow patterns into powerful orchestration using Executors, Edges, and Events. From core workflow patterns to advanced agent orchestration.'
resource: https://www.youtube.com/watch?v=nENs3UndI2o
sources:
  - id: video
    resource: https://www.youtube.com/watch?v=nENs3UndI2o
    title: 'Microsoft Agent Framework Workflows: From Zero to Hero (YouTube, Microsoft Reactor)'
  - id: description
    resource: ../sources/microsoft-agent-framework-workflows-from-zero-to-hero.description.txt
    title: Video description
  - id: captions
    resource: ../media/microsoft-agent-framework-workflows-from-zero-to-hero.en.vtt
    title: Automatic captions (en)
moca:
  evidence:
    - source: description
      selector:
        type: TextQuoteSelector
        exact: 'Microsoft Agent Framework Workflows: From Zero to Hero is a practical developer session that turns familiar workflow patterns into powerful orchestration using Executors, Edges, and Events. From core workflow patterns to advanced agent orchestration.'
    - source: captions
      selector:
        type: FragmentSelector
        conformsTo: http://www.w3.org/TR/media-frags/
        value: t=0,37
      note: Opening
    - source: captions
      selector:
        type: FragmentSelector
        conformsTo: http://www.w3.org/TR/media-frags/
        value: t=37,193
      note: Introduction to AI Agents vs. Workflows
    - source: captions
      selector:
        type: FragmentSelector
        conformsTo: http://www.w3.org/TR/media-frags/
        value: t=193,301
      note: Workflow Building Blocks (Executors, Edges, Events)
    - source: captions
      selector:
        type: FragmentSelector
        conformsTo: http://www.w3.org/TR/media-frags/
        value: t=301,557
      note: Five Orchestration Patterns Overview
    - source: captions
      selector:
        type: FragmentSelector
        conformsTo: http://www.w3.org/TR/media-frags/
        value: t=557,903
      note: DevUI - Run & Debug Visually
    - source: captions
      selector:
        type: FragmentSelector
        conformsTo: http://www.w3.org/TR/media-frags/
        value: t=903,1346
      note: Sequential Pattern in Code
    - source: captions
      selector:
        type: FragmentSelector
        conformsTo: http://www.w3.org/TR/media-frags/
        value: t=1346,2118
      note: Concurrent Pattern in Code
    - source: captions
      selector:
        type: FragmentSelector
        conformsTo: http://www.w3.org/TR/media-frags/
        value: t=2118,2288
      note: Handoff Pattern Concept
    - source: captions
      selector:
        type: FragmentSelector
        conformsTo: http://www.w3.org/TR/media-frags/
        value: t=2288,2611
      note: Group Chat Pattern Concept
    - source: captions
      selector:
        type: FragmentSelector
        conformsTo: http://www.w3.org/TR/media-frags/
        value: t=2611,2997
      note: Agentic (Manager) Pattern in Code
    - source: captions
      selector:
        type: FragmentSelector
        conformsTo: http://www.w3.org/TR/media-frags/
        value: t=2997,3280
      note: Executors and Fine-Grained Control
    - source: captions
      selector:
        type: FragmentSelector
        conformsTo: http://www.w3.org/TR/media-frags/
        value: t=3280,3516
      note: Q&A and Best Practices
---
# Microsoft Agent Framework Workflows: From Zero to Hero

[Watch on YouTube](https://www.youtube.com/watch?v=nENs3UndI2o) · [Microsoft Reactor](https://www.youtube.com/channel/UCkm6luGCS3hD25jcEhvRMIA) · published 2026-09-03 · 58:36

## Description

Microsoft Agent Framework Workflows: From Zero to Hero is a practical developer session that turns familiar workflow patterns into powerful orchestration using Executors, Edges, and Events. From core workflow patterns to advanced agent orchestration.

We'll cover:\
🔹 Sequential and parallel workflows\
🔹 Fan-out / Fan-in orchestration\
🔹 Handoffs and intelligent routing\
🔹 Multi-agent collaboration\
🔹 Executors, Edges & Events\
🔹 Real-world workflow patterns you can apply immediately

0:37 Introduction to AI Agents vs. Workflows\
3:13 Workflow Building Blocks (Executors, Edges, Events)\
5:01 Five Orchestration Patterns Overview\
9:17 DevUI - Run & Debug Visually\
15:03 Sequential Pattern in Code\
22:26 Concurrent Pattern in Code\
35:18 Handoff Pattern Concept\
38:08 Group Chat Pattern Concept\
43:31 Agentic (Manager) Pattern in Code\
49:57 Executors and Fine-Grained Control\
54:40 Q&A and Best Practices

\[eventID: 27462\]

## Transcript

### 0:00 Opening

[0:00](https://youtu.be/nENs3UndI2o?t=0) I hope with this session here you're excited. We're going to have concepts. We're going to have codes. Uh my intention is to go through the concepts first and then exploring on codes. So if you have like any questions raise that up. Uh probably going to rely on on reactor to facilitate that. But bring your questions perhaps if I don't get to answer them as they they come uh through coding. We're going to be uh exploring that in details. So let's start in here

### 0:37 Introduction to AI Agents vs. Workflows

[0:37](https://youtu.be/nENs3UndI2o?t=37) with AI agents and workflows. Um we can compare like them. Let's do like a comparison. For example, with workflows, it's always uh predictable, right? We can't say and compare like a workflow being a train on tracks. So it's never going to derail you know that starts at some point is going to finish at some point and it goes as uh we can predict. So there are we we say like in technical terms that they are deterministic because we know like we can predict we we have a predefined path. It is repeatable. So they can execute multiple times and they don't change and you can do it's auditable as well because you have like traceability and you see exactly what happened at that moment in time. So that's like the characteristics of like a workflow when we look like at

[1:40](https://youtu.be/nENs3UndI2o?t=100) AI agents they are a little bit different because they're very dynamic. So we can compare them like a taxi navigating traffic. So if you are visualizing that like there's traffic in the and things are just completely stuck. Agents are going to find a way to deviate or find alternatives, right? Alternative routes. So we're looking here. They're dynamic. They're adaptive. They are made for open-ended problems like ambiguous problems. So when we have um Microsoft agent uh framework workflows, we're basically combining them together. And so we're putting like so we have the workflows for the rails and the agents for the dynamic decisions that happen inside the workflow. So regardless on where the the uh uh the step of the

[2:43](https://youtu.be/nENs3UndI2o?t=163) execution the AI agent is you know that's going to have an input an action is going to happen and there will be an output right to then something else occurs finalize or having like a continuity of our execution but we bring like agents to behave and combining with uh uh uh a predictable uh pathway.

### 3:13 Workflow Building Blocks (Executors, Edges, Events)

[3:13](https://youtu.be/nENs3UndI2o?t=193) There are some building blocks on when we look at the different piece of how the the workflows uh behave within the agent framework. We're calling them like here like the major ones that where we have our code or logic the executors. So they're rack logic uh any sort of logic but you expect some sort of input and an output and they should be typed so you you know exactly what's coming in and exactly what's going out. And here we have like this example of two executors and we have something here in between connecting them. We call them edges. And this is a direct connection that allows us to uh take the outputs of one executor and connecting to the input uh to the next executor and well there's like full type safety.

[4:14](https://youtu.be/nENs3UndI2o?t=254) They get validated at compile time. So which is one of the greatest things about uh agent framework flows. And there are like life cycle signals, right? Those events that are triggered when something happens. For example, our executor that's been invoked or maybe our executor has finished. So we have this event of completed perhaps we're looking like the whole workflow uh process like where we have workflow started, workflow output. So we have like events where we can listen to and depending on what you're implementing you could have like any particular uh action from it

### 5:01 Five Orchestration Patterns Overview

[5:01](https://youtu.be/nENs3UndI2o?t=301) and then we have those five orchestration patterns. So those ones are the foundations really for uh the different sort of orchestrations that you could combine or you could have because they help us defining some sort of behaviors and for example where have like sequential pattern that you know that the agents they're going to be executing one thing one let's say one task after the other. We have the concurrence where the agents can execute tasks in parallel. The handoff, it's when we have an agent that's more like a coordinator that transfer control to another uh agent. So just transferring context. The beauty of the agent framework flow is that the context it's all managed for

[6:02](https://youtu.be/nENs3UndI2o?t=362) us. So we don't need to worry about that. you just need to plug and play uh the the workflows together. We have the group chats where we allow we have like these agents talking to each other and they share a conversation and the magentic one where it's a more specialized sort of orchestration where there's a manager uh a sort of like an agent that coordinates the actions that are going to occur. But not only that, there's a planning in that's executed by this manager. The manager tells who exactly needs to perform what. So this two here are new ones. The hand off they're like with all the integration um mechanisms to do something like that. But those are uh I would say are going to become more popular with agentic AI

[7:03](https://youtu.be/nENs3UndI2o?t=423) agentic workflows. So and you can combine them. So they can can be combined and should be combined according to your requirements. Uh before I jump to that one thing I I want to mention is that this is part of AI 500 uh certification. I just put a label here because I was uh part of like having like this exam and I noticed that it's part of the the my studies. So there's a particular um topic where all of the orchestration patterns are approached. So we are covering here part of the exam as well. And as I said that we can combine those orchestration patterns here for example where we have this input and the end the output. But you can see that we have a combination of sequential with concurrent flows because as things

[8:06](https://youtu.be/nENs3UndI2o?t=486) finish in here like the parallel execution they are aggregated. We basically have one two three steps in here. This is a another well it's a pattern called like uh fan out fan in but they're basically composed by sequential and concurrent uh orchestration patterns basically have like this entry agents parallel specialists and this aggregator. So you you're free to combine them just to match like the your requirements. One thing that's important for us as developers is that uh everything that I'm going to be approaching here is from code. So I'm we're going to be approaching .NET. So I have a samples available. But when you run those workflows, if you don't have a visual way to see what's happening, you simply don't know uh what happened. you're only going to identify what

[9:08](https://youtu.be/nENs3UndI2o?t=548) happened by looking at logs, right? Open telemetry and see exactly like the traces that happen. Um, some developers

### 9:17 DevUI - Run & Debug Visually

[9:17](https://youtu.be/nENs3UndI2o?t=557) might be okay with that. Others prefer like a visual way. And then we have Dev UI that's going to assist you to run and debug like those workflows visually. So we have a web front end that helps us visualizing what's in there. So it's a web UI where we can uh provide params see exactly what's happening and the beauty of it is that we have uh real time um display of the actions so we see exactly what's happening at the that point in time. uh the WY it has uh open AI compatible API specifically with the responses uh uh protocol is that there's implementation for that and it makes easier our from our code to talk to devi right because there are different ways for you to you could have for example in net we have console apps where you have just um um

[10:22](https://youtu.be/nENs3UndI2o?t=622) prints on UI but what we can do we can have APIs with donets and then having a way to connect uh with dev UI through endpoints that's exactly what DevUI provides to us there is support for open telemetry like trace or observability which is good because then we see exactly what happened. Uh this is recommended for development only and should not be productionized even because this is at preview. Uh and things are changed on this space. Uh for now devi but things could could change on this field. One thing that I noticed is that if you look at at the beginning of the year, all of this was simply preview and now we have agent framework on on G8 right the part of the library but that

[11:23](https://youtu.be/nENs3UndI2o?t=683) UI is still preview things could change so it's something that you should not use for production at all only for development purposes just looking here uh at the chats so to see like how if there are like any sort of questions. Let's see. Okay, just checking here. Yeah, there's a question here from Edge Pereira where I think like maybe later like maybe this could be showed like to to the public, but what decision framework should an org uh here you go. What decision framework should an org use to determine whether a use case needs a single agent deterministic workflow or a multi- aent workflow? uh this one uh in terms of decision framework uh I think like there are

[12:25](https://youtu.be/nENs3UndI2o?t=745) different methodologies like because this is not you could like look at this like from a technical perspective but what you would do is that you would have your business requirements like any sort of uh business functions and the process really that happens in an organization and then from there like as you have mapped what happens with those business processes then you convert them onto a particular workflow depending on the tasks that need to be executed. They could be agentic uh where you're bringing LLMs right for uh these sort of open-ended challenges or they could be just procedural uh executions where you could have simply just logic right so I say that like an agent uh it's a logic with a a brain LLM it has like tools all of that but when you don't have that brain it's simply a job so that's going to help you define

[13:28](https://youtu.be/nENs3UndI2o?t=808) whether you need like a single agents perhaps you need to have multiple agents or how you're going to coordinate them. If I talk about like a single um let's say like a sequential the sequential pattern that I have my screen things could take like longer for executing perhaps if you want to look at performance you could make things to work in in parallel so but to start right so I think the decision comes from business processes and then you evaluate each step of this process it's simply like a job or you need an agent to do that sort of work and then how you organize looking at performance or even like the behavior uh and the challenges of those uh problems that's where we have like the other patterns group chats magentic they're more uh they're different from what the market has been using for a long time I hope I have answered your question but yeah uh so

[14:30](https://youtu.be/nENs3UndI2o?t=870) just bring like those on and then I'll have a look at them just continue here. Uh I want to jump to code and what I'm going to do in here is just uh intercolate and transition from slides to code and then just to show like uh just as a teaser for you to see how it works and how the code is structured as well. But on the sequential pattern we I explained that the tasks happen in in sequence, right?

### 15:03 Sequential Pattern in Code

[15:03](https://youtu.be/nENs3UndI2o?t=903) I'm not going to jump in here like to explain this particular use case. I'm going to jump to the codes and then we can see exactly what's in there. I have my zoomit in here. But this is the sample I'm making available. Right? So it's a Microsoft agentworkflows.net. I put this for demonstration purpose. Microsoft agent framework has um their own uh repository. I did this because of the session, right? So, I just putting things together that make sense for this uh presentation. But what you're going to notice in here is that we have oops we have different parts of the solution in here where we have three parts. The first one is the simple one where uh I have all the workflows all together. So you could just run this one and see what happens.

[16:06](https://youtu.be/nENs3UndI2o?t=966) And then I have the different uh orchestrations split into a console. This is a console or um uh UI web UI. Uh it's basically an API and I have like a shared library where I'm sharing tools and we're going to see like how it works and here's the complex one where really diving onto the executors right uh as framework abstracts has different abstractions in here it's very simple in here we go a little bit deeper and here we it's hands on like I'll say like it's full We're going to go hands- on and everything, but this is very detailed, right? So, uh, but that's the structure of the project. Let's go like to the sequential and just to show what I have. So, let me see. I think I'm going to pull like a little bit bigger. That

[17:06](https://youtu.be/nENs3UndI2o?t=1026) should be okay. But we have three parts of the code. All right. And let me show like the sequential here. is that what I have is this package where everything happens right agents AI workflows I have some the extensions as well and I this is I would say kind of in all agent if you're using leverage agents this is kind of standard you need depend on where you're using OpenAI Azure you kind of mix Yeah, but for the workflows you need this agent agents AI workflows and extensions AI as well which is kind of if you're doing chats or uh not workflows you also like get to use that but that's what we have in here. uh in terms of the solution we have variables open AI endpoints deployment

[18:06](https://youtu.be/nENs3UndI2o?t=1086) name API keys and then we have our agents after we set up that which is coming from user secrets okay so I'm not going to share my secrets in here but I'm using user secrets as you have those params then we can have those executions you're going to see that uh imagine that if we had agents controlling uh aircraft takeoffs. What we have here is is that we have a runway scan agent that looks at any sort of impediment, right? It's just to get the thumbs up if like the surface conditions are all good before departure. We have a air traffic control agent that looks or checks the output from the runway scan agent and it says okay responsive cleared or hold right so it's going to allow or forbid the departure and we have the pilot agent that's going to put like the the engines

[19:11](https://youtu.be/nENs3UndI2o?t=1151) on hold right or not or it's going to departure we have tools And the tools in here they are um well if I am to bring them so they're part of the shared library but they are bringing random decisions right. So it's going to pick randomly a particular decision. So things are going to be completely dynamic. We could get like a clear runway takeoff uh or maybe we would be blocked. What I'm going to do, I'm going to run the code and I have like a break point. One of the things with the agent framework is that we have those rappers. I say this is a wrapper because the only thing we're are passing here are just the agents. Okay, there's another agents in there, but it's so simple that we have build sequential. That's it. That's going to do the work for us. We don't need to dive into an extra level. Uh it

[20:12](https://youtu.be/nENs3UndI2o?t=1212) just like depending on what you want to do, this might be enough really for you to get going. What I have in here is just like some helpers don't uh not not of a concern, but what they doing is that they taking they're printing to the Y and we have like this to be run as a stream. Let me pull like this one as uh as a startup. And I'm gonna run that. And we should we should be able to see the let's see here the debug should start to some points. Okay. Yeah. Came up \[laughter\] first run. Anyways, but I'm going to run this. I have my console. I'm going to bring the console in here as well. But as soon as I trigger that, we should see some behavior in here. And the UI the console should display that to us. So like

[21:15](https://youtu.be/nENs3UndI2o?t=1275) there's a sequential workflow the runway uh scan agent is saying that low debris is spotted. So it's f it's running. So we found like a impediment but it's running those sensors and as I said they're random. So they're just making it uh validating things as it happens. But when you look like there are like hazards have been identified then we have the air traffic control agent doing oh look hold. Okay. So he made a decision that okay nope. Uh based on the conditions this is going to be on hold and then in the end we have in here that engines have been cut by the the pilot. Okay. So we see that well one output from the runway scan agents served as input for uh the air traffic control and then for

[22:15](https://youtu.be/nENs3UndI2o?t=1335) the pilots. So this is the sequential way. What I want to do is just to continue exploring the other patterns. Right

### 22:26 Concurrent Pattern in Code

[22:26](https://youtu.be/nENs3UndI2o?t=1346) in here we have the the concurrent where we have those parallel. Let's see if I might ponder why is it here that's the fan out fan in right. So we have like a coordinator and then things they kind of branch and we have multiple agents in execution. In the end we have aggregation. So we can run them simultaneously. They can work in parallel. So this is one of one of the performance uh indicators or to help us to define like the total time. Perhaps if you had the sequential it would take like a longer periods. If you are if you can make them run in parallel then you can save time but it depends on the use case. There are case where even though you have mo many uh agents they need to run in sequence because you're depending on the outputs of others. So in this case here we are saving time and we

[23:28](https://youtu.be/nENs3UndI2o?t=1408) using like this uh fan out fan in pattern in here with the concurrent uh u flow. Let's see this one with devi. All right. So the first one we explored on console the this one what we're going to do is to explore with the web dev UI for that one is going to be the concurrent I'm going to put this one on my to start in here let's look at the codes actually before that on the project uh you're going to notice that we have this guy here. Okay, this one is my version that's in preview, but that's the dev UI. So, we're bringing a nougat package for it. Similar structure that we have, but what we do have in here is that we are

[24:30](https://youtu.be/nENs3UndI2o?t=1470) bringing devi as part of the pipeline, right? The donet pipeline using service collection. Not sure if I'm familiar with that, but that's how we inject instances of uh objects onto the donet pipeline in here uh with the web API. Uh same different parts, same as I said like user secrets, variables, but then we start uh hooking things onto the service collection, right? So adding the chat client and then we're adding those agents and we have like similar behavior like with similar structure with the system message with tools right then the same here. One interesting point is that uh during the football world cup we were doing um well that's when I produced like this this demo and then what I put in here

[25:31](https://youtu.be/nENs3UndI2o?t=1531) it's a concurrent uh flow where before like the sessions or the matches can happen there are a lot of things that could go wrong. All right. So with power like safety if like there are like any sort of hazards the stadium capacity if things are anything that could go wrong in here. What I I I did is just putting putting all of those checks to be executed right and to be validated. So we have like a fields operations agent that's going to check for stadium lighting uh go structures everything that related to the structure of the field operations stadium safety agents it's going to look emergency exits fire suppression systems all of that medical readiness agent so it's going to validate their paramedics ambulance all

[26:31](https://youtu.be/nENs3UndI2o?t=1591) of that power systems agents. It's going to check like power backup generators, power supply, and we have the broadcast systems as well. Verify if the broad the cameras are all good. There's network connectivity. There are lots in here, right? So, but what's important is that we're going to get a validation whether it's ready or if it's blocked, right? So, the match can happen or not. I reckon like if that was really to be the thing imagine if they were to cancel a match that would be \[laughter\] that would be catastrophic right so but in here we're trying to simulate what could go wrong and because it's all random things could go wrong in here uh when we look at service collection now is the important part with devi we're hooking okay all of that in here like devi even the responses in here conversations they

[27:32](https://youtu.be/nENs3UndI2o?t=1652) belong to WUI. So we are WI has its own abstraction that's going to take the outputs and display on on the UI for us. But more importantly, we have the well agent framework doing the heavy lift. And when you look in here, we have this I built concurrent. That's a pretty good like abstraction. That's where we're passing the different agents, right? So you can see we have those agents, all of them in here, but they are passed in here. Okay. So, it's Yeah, we're adding them onto the pipeline. Let's run that and then we can see what happens. I think I put this one on my startup. Let me just run that. That should open. Uh, let's see. That should bring me. Oops. When it does,

[28:34](https://youtu.be/nENs3UndI2o?t=1714) it's coming. Let me bring my console. So, there is an endpoint here. 7,05. I'm I'm on work. I'm working on let's see on Chrome. Uh should be this one. Cool. Uh yeah, by the way, we have URLs and the URLs are the ones where all of these oh the contents that came like um that helped me creating this session with like Microsoft agent work framework flows come from Microsoft learn and we have the workflow orchestrations right the ones I mentioned and devi uh it's interesting on this case. We're going to see what it what it is the details in there. But the C one there's there news in here and that's something we can see that's going to it's going to go to Aspire. Okay. So there are things happening and

[29:37](https://youtu.be/nENs3UndI2o?t=1777) currently I don't have Aspire in here but I can see that there will be updates in here like soon for us. What I need to do is that I need to bring my URL and then I need to include that. Oops. I need to include dev UI. If I don't do that, nothing happens. So, let me bring it. Cool. So, that should be loaded. Yep. And it's interesting that we have like this UI where we can visualize the different agents. So, I could talk to those agents, right? and see like how they what they're doing like what can you do? Uh this is for the broadcast systems agent and I can talk to it. It's going to say yeah I'm I'm just like the broadcast systems agent for the workup. I verify all the broadcasting stadium communications. So you have those details in here and there are different parts like what you can see. So I just

[30:39](https://youtu.be/nENs3UndI2o?t=1839) click on this on this bubble. I can see that I'm using GPT41 for it. Everything it's in memory. I have my system prompt remember like the ones or like on code they're here. They're being displayed and I have different tools. All right. So all of those tools are the ones that are randomly being triggered and they provide different sites. We have uh well that's the conversation. I can see the number of tokens. I think I I can delete the current conversation, start new ones. Uh I have the events in here. I sent this message. There were events that were triggered. Uh we don't have like it's kind of limited. We don't have like ways of sorting, ascending, descending. But what you can see is that it's descending. So we are having the latest on top and we see what happened. Right. So exactly traces and tools. Okay. What I want to do is to trigger

[31:39](https://youtu.be/nENs3UndI2o?t=1899) the workflow. So, we have the workflow in here. Yeah, look at that. Well, I think if I zoom in, I didn't create well, we all connected with the build concurrent, but agents framework created this and look at that. If you look, we have executors. So, remember the the building blocks. So they are execute there are executors doing the work for us. All right. So but we didn't jump to it. So agent framework has this abstraction and it can it is doing that for us which is cool. Uh so we don't need really to uh uh um manipulate those executors. um if you don't have like any requirements to I'm going to say like for example you could do create the executors and manipulate them if you really want to have fine grain control okay uh I'm

[32:43](https://youtu.be/nENs3UndI2o?t=1963) going to show here on the complex um soon uh the complex examples but yeah if you want fine grain control then you use executors but it adds additional degree of complex XY but you can do that in in have better control of what happens. Uh what I want to do I want to copy the prompt. Uh I had opened the UI but my prompt is on the console. I'm going to copy this and then we can look together. So let me just bring the UI again. Here we go. And we're going to put like this input in here. And that's like I'm saying assess all the field operations, stadium safety, medical readiness. That's my prompt. That's my user prompt. And when we trigger that, we're going to see things happening. We're going to see colors, right? Meaning that the agents are in execution. When it gets green, it means that the agents have finalized.

[33:44](https://youtu.be/nENs3UndI2o?t=2024) Let's trigger that. So we can see that the agents are running or in parallel. They are performing different actions. We can see the events are being triggered. They're growing. We can see the colors that have been are being f or are being they're being modified and then all of a sudden we have everything that happening here right uh by looking here I would need to dig and see exactly what happened at some stage we should be able to see uh one of the decisions we could see I think this one is just here online fire suppression online safe clearance denied So I can see that things in here didn't go like stage is not is not safe unsafe and then okay yeah you have a way of visualizing that under like the events right at the same time because I had my console you can see the colors in here but every single color represents what

[34:45](https://youtu.be/nENs3UndI2o?t=2085) one agent is doing. So there was a medical broadcast power uh system down here, right? So yeah, you would say like what what happened? So the broadcast PA system is is down. So so what happens is that uh no the match has been cancelled, right? So that's not happening at all, which is not good. Uh but that's part of the fun. uh and then we have the handoff

### 35:18 Handoff Pattern Concept

[35:18](https://youtu.be/nENs3UndI2o?t=2118) uh in here like on these three patterns I'm going to explore on codes one of them is just because it can be time consuming but let's see all of the concepts in here how they work and then we jump to a a single case uh for the case I think like the magentic one shows um um how the Handoff pattern is kind of in there, right? Let's explore first the the orchestrations. And then we have the handoff. Where's my laser point? And with the handoff pattern, what happens is that we have this conditional uh routing by between specialists. So what happens like for example this triage agent? So imagine that we have a customer service and we're talking to their supports. We could have like a

[36:19](https://youtu.be/nENs3UndI2o?t=2179) distriage agent that verifies the request and if the person is saying that for example that being built twice for a particular service the agent would have the would be smart enough because it has prompt to decides whether to uh hand it over to a billing fraud or the technical team because like let's Say if you're if you have a subscription but you have been build twice you wouldn't be fraud. It wouldn't be a technical issue would be like a billing concern an issue. So the triage assist agent would hand it over to a billing agent to sort things do a refund of the the duplication or the payment that was made like in duplication. If there was something suspicious, something could be fraudulent, the agents could would hand it over to the fraud agent. If the

[37:22](https://youtu.be/nENs3UndI2o?t=2242) person is saying that's trying to submit something on the the website, e-commerce for example, there's an error on the page or so that would be more like a technical issue. So the agents could triage another agent. But what it does that this coordinator has the knowledge to hand it over to specialists right and with that all of the context is managed by agent framework so we don't need to manage that agent framework does that for us but it it says here the context passed selectively to the next agent right so it's not going to be passed to the agents that don't have any concern about that issue

### 38:08 Group Chat Pattern Concept

[38:08](https://youtu.be/nENs3UndI2o?t=2288) Then we have the group chats, right? So that's another orchestration pattern where the agents collaborate in a shared conversation. Right? So when it says in here a shared conversation is that they're going to take turns and there is a coordinator that tells look it's your time to say something and depending what he does the coordinator would just pass to the other agents right in general like you have there are different ways routing in general like that every single agent has uh a particular time or a particular turn to come and provide some input or just pass the turn for another agent if what was discussed was not of the concern of the agent. But for example in here that there's uh as if you were to have you're creating like a paper uh a university paper for

[39:11](https://youtu.be/nENs3UndI2o?t=2351) example and then like we're calling this like a builder but would be the students but the students trigger this this workflow to create a paper for and then we have like this builder that would take the inputs from a user for example the user would submit to a coordinator the coordinator would say look this is the context. This is what was being provided by the user. The builder would start creating like a paper. Then the builder finishes. Then coordinator pass to the the next one in line rounding for example where there's a critic that would provide some out um feedback and then with the feedback there could be like it could ask for uh input from researcher. So this one it wouldn't be a concern of the reviewer. The reviewer would just be passing to the researcher and the would be cycles of this running. Okay. So this could run like it just depends on how you have defined the

[40:13](https://youtu.be/nENs3UndI2o?t=2413) could be random could be round robbing. But what's important here is that they're taking turns all the participants in here. What's important is that you need to have termination rules in here. Um termination rules could be something uh that would be the language like natural language where depending on what let's say the reviewer the final reviewer could say that yeah this is looks great it's approved right or for for me the terminology approve could be the natural language that would be passed to the coordinator and the coordinator would have a prompt to identify has been approved. Yes. Finish. Terminate the flow. Uh there are cases for those open-ended problems where the you could define iterations, right? And they would spin until you get uh they

[41:15](https://youtu.be/nENs3UndI2o?t=2475) get to resolve the issue or not, right? So it's a a new pattern. So but you have like you need to specify termination rules otherwise you might incur in burning tokens and then you pay the price. So and this is the magentic pattern where it's a if you look in here it kind of resembles like the handoff pattern but a little bit smarter. Uh I would say it's just like that the hundi is great. It's just like doesn't have that sort of complexity uh embedded because uh you don't need like that sort of decision uh that's made with this manager. But what happens is that this manager he defines a plan dispatch for the specialists and based on the outputs of these specialists it adapts and evolves the

[42:18](https://youtu.be/nENs3UndI2o?t=2538) plan. Okay. So this is more like a um yeah this is to be used like for complex problems and where you need really to evolve based on what you got is that you review the the plan that needs to be uh modified and then you have like another action and everything here we call like the task ledger where the history really makes like a a difference on the decisions and you you see like the manager can ask uh for like a human. So there's a human in the loop. You could just say that ah look uh the man manager could say uh this here is the plan. Are you fine with it? Do you want to improve? So you could have like this this human in the loop to validate the plan and then approve and then the manager would just dispatch to the specialist, right? So it does that and replans at each step. So the special is report back to the manager and that can

[43:20](https://youtu.be/nENs3UndI2o?t=2600) it can adapt best for open-ended multi-step problem solving. So this one it's a uh it's um

### 43:31 Agentic (Manager) Pattern in Code

[43:31](https://youtu.be/nENs3UndI2o?t=2611) I would say the magentic it's a combines the sort of hand off with uh planning and this concept in here with the manager right that's not only a coordinator it really makes the decision and evolves u uh the the flow based on on those outputs from the different specialists. Let's go to the code. Okay. And for this one, uh, let's go with the magentic. Let me close that. And that magentic. I'm going to do the console. The console is complex enough to to approach with the web UI. We don't we don't see it, right? You need to dig through the traces. So it helps assists you visualizing what's going on during development but when you need to dig onto the telemetry open telemetry yeah

[44:31](https://youtu.be/nENs3UndI2o?t=2671) it can be too much okay but up to you like I prefer combining both where I can view or visualize what's happening and with devi seeing like how things are connecting then jumping back to a console and seeing the outputs okay But it's yeah it's just like a personal preference. Everyone has a different view on that. And with the magentic right the programming here similar structure variables and we're creating agents. Okay. But then uh you're going to see that's kind of complex because imagine this uh as um a security incident. Okay. So if a when a security incident happens, we have this commander. The commander's orchestrator is the manager. So the the manager is going to say, "Look, there there's been a security incident. We're going to be triggering uh some analysis, right? So I

[45:34](https://youtu.be/nENs3UndI2o?t=2734) have my commander and the prompts for that. But what he knows, he knows that we have specialists. We have a identity specialist, a network specialist, endpoint analyst specialist, a threat intelligence and a sock analyst. All of them they have different concerns. Okay, different tools in here. Remember all the tools here are they generate random output. But we have different concerns in here, different specialists. What's nice is that well agent framework is kind of bringing a way for us to hook them uh a little bit better if uh we're going to jump straight away to the complex scenario. But in here it starts getting a little bit more complicated but we have a wrapper the magentic workflow builder and then we're passing the agents. Oops here. Okay. And one thing

[46:36](https://youtu.be/nENs3UndI2o?t=2796) require plan sign off. True. So I am the human in the loop. I will need to approve this plan otherwise nothing happens. Um you need to have some guard rails like for example the number of rounds things could spin out of control if like for those open-ended problem. So you need to have better control for like finalize and terminate the the flow if you needed if things get like for stalls things don't happen if you need to reset so there wasn't an agreement or things evolved to the wrong direction but things could happen right so you need to have uh a plan for terminating when things don't work as expected I put like this one uh startup and I'm going to run Okay, I don't have break points but intent to trigger this and then we can see that I'm the human in the loop and I should be open. Let me close that.

[47:38](https://youtu.be/nENs3UndI2o?t=2858) I should be able to approve that. So I have this one. So there's a cyber security incident. That's what's being provided in here. And it say that each agent specialist gets two terms. Okay. first to surface raw findings. Second to cross reference things. So here it has the magentic plan. Okay, magentic plan. So it's proposing a plan for me and then okay yeah going to bring the identity specialist going to do this network agent endp point. Okay based like adjust investigation as new evidence emerges. Please enter to approve or type feedback to request a revision. I could say look include like more details about I don't know fires look at these particular instances but for the demo yeah I'm going to approve I just entered and what we should see here start seeing the tools right the callers being displayed because the agents are

[48:40](https://youtu.be/nENs3UndI2o?t=2920) working right at some stage we should have uh uh feedback or some sort of analysis a reporting of what happened. So looking here network IP reputation logically residential data payload loaded to fish proxy attacker second logging has no VPN session look like fishing domain resolved before incident so there like some different tools being triggered that's going to provide as inputs for the decision making browser extension suspicious extension installed minutes before the incident so imagine like that there was a cyber cured uh events like in here it's saying that like an extension a browser extension that has been compromised right so we have some flags happening here and what we should have is that a decision in the

[49:40](https://youtu.be/nENs3UndI2o?t=2980) end okay I'm going to let this one running and then we should be able to see it I I still want to show the complex one let me just come back. Let's see this one. Okay.

### 49:57 Executors and Fine-Grained Control

[49:58](https://youtu.be/nENs3UndI2o?t=2998) Uh because we have the executor. In the executor, we have a base class and that's where you have fine control. Okay. So, you could implement your own executors. They have like an infire. They are typed. Let me bring my laser point. The types you have a life cycle. When we look at them, there are many of them. uh I'm not going to jump onto the details but executors can have an input input output there can be reflection this one it's been deprecated but it's been there for evaluating uh dynamically like the um inputs output with states using like in chats okay uh I'm going to show the example in here is there of the complex uh here. Okay,

[50:58](https://youtu.be/nENs3UndI2o?t=3058) remember like the stadium validation in the check, right? So the match can occur or not. We have those executors dispatchers dispatchers exe field. But let's look at here the create method. Well, it's a it has like implementation. It has the inputs, it has the outputs, but I don't have we don't have the brain here. We don't have LLMs. So, it's just a wrap around logic where I'm validating if it's a user or not depending on the role. But it's just a job, right? So, an executor here perform a job for me, but has nothing to do with AI. But this one, the medical, it does. Can you see? Like we have a chat client. So, when I jump to that, they're exactly the same. But in here we have look at here the handle we have the eye agents okay \[clears throat\] I have my prompts I have my tools I have my session

[52:00](https://youtu.be/nENs3UndI2o?t=3120) I'm controlling this the executor is basically a wrapper okay is a so you could do you have full control you could uh inject logging put like other sort of validations logic in here okay so it gives you flexibility right so It's interesting that it's something that for production workloads you might end up getting to this because it gives you flexibility to modify the logic for it. Okay. So that's something it's more like for your your awareness knowing that's in there and then you can explore. Let's see if like the prompt or the agent finalize. It did. It did finish incident report reports. Okay. So, we have that start confirmed there. There's been like impact session hijacking. So, it has after all of what happened

[53:01](https://youtu.be/nENs3UndI2o?t=3181) based on the tools that we had identified there was a session hijacking and it's bringing all of the reporting for that. Okay. Evidence. you grab like the outputs from the different specialists recommended immediate uh actions. So I have like everything here like to provide a report and the magentic workflow is just matched like my requirements in here which is good because uh that that was a complex problem that need like insights and a dynamic view of okay the different variables that was just thrown along the way to the manager with that. Uh that's like the key takeaways that you pick like the shape that fits your workloads. You can combine them and build like your workflows, your orchestrations composing like those patterns. If you know like the executors, you have better

[54:02](https://youtu.be/nENs3UndI2o?t=3242) control, fine grain control on your logic. One of the things in here is that this is the QR codes for the repository. I invite you to jump in there. If you're using GitHub, just leave a star. I appreciate. Yeah. And I think with that, I'm just finishing the the session. And just if you have questions, we can look at them. \[snorts\] Let's see. Okay. Let's see. Thank you. Um save

### 54:40 Q&A and Best Practices

[54:40](https://youtu.be/nENs3UndI2o?t=3280) edge how is accountability there's a message from edge uh edge bera uh how's account accountability maintained when several agents collectively produce one outcome any practice recommendations we should start using yeah on this one I think like there's as part of your development you should evaluate the prompts uh is just because you want to have some guard rails to check like if the answer that's been produced matches the intent the initial intent we didn't explore in here but there are like ways for you to evaluate prompts different techniques even in the net space there are like libraries to help with that in general you lot of them in Python. But as part of your practice before like launching

[55:43](https://youtu.be/nENs3UndI2o?t=3343) bring those agents, you should have some uh validation and have like valuations to check whether you're getting the outputs if they match your original intent. Right? I think that hopefully that's helped with some answers. Uh Edge, let's see. Uh let's say we build workflows like this to a legal office. How can sensitive data be prevented from flowing to an agent that does not need it? Is it possible? So there's a library now that with the donet uh it's usually like for harness and what happens is that there are different guard rails in there where you can even control if PII information should be passed as part of the context or not. So you just control through parameters and then you need to specify look PII information should be ignored

[56:46](https://youtu.be/nENs3UndI2o?t=3406) completely. Right? So that's how you do it. in net there's a library I think it's harness.ai AI following exactly the same path but you you you can just find that in Google. Uh so that's something that I think the the Microsoft agent framework team has been working on. There are additional libraries for that. I didn't put on this this example but it's available for you to use. I think with that all the questions have been uh validated. I'm not sure if Isabelle if you're coming to the session or not but just in case if the the reactor team doesn't come like to thank you uh for being part of the session and be in touch. I share like all of the details at the beginning

[57:46](https://youtu.be/nENs3UndI2o?t=3466) of the session and yeah uh very happy to know like what you've been doing and understand like your challenges. So I perhaps you help me preparing some use cases where I can approach with the technical community or even if you are interested we can chat and then we can align a session with you as well on my uh the user group uh I lead. Yeah.
