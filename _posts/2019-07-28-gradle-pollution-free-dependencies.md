---
title: Pollution-Free Dependency Management with Gradle
categories: [java]
modified: 2017-07-28
excerpt: "Unwanted compile-time dependencies can lead to problems. This article discusses these
          problems and the solution Gradle provides to keep dependencies clean."
image:
  auto: 0001-network

---

Remember the days when we had to manually download *every single JAR file* that our project needed to run?
And not only the JAR files we directly depended upon, mind you, but even those JAR files that our 
dependencies and our dependencies' dependencies needed to work!

Luckily, those days are over. Today, build tools like Maven and Gradle take care of resolving
our dependencies. They do this following the rules of [scopes and configurations](/maven-scopes-gradle-configurations/)
that we put into the build script.

This has a downside, however. Years ago, when we downloaded each of the direct and transitive
dependencies manually, we could decide for each of those dependencies if we really needed it for
our project to compile and run. **Today, we pay less attention to specifying the correct scopes or configurations, which often 
results in too many dependencies being available at compile time.**

## What's Dependency Pollution?

Say we have a project X. It depends on libraries A and B. And C is a consumer of project X. 

![Transitive dependencies are implicit dependencies.](/assets/img/posts/gradle-dependency-pollution/implicit-dependency.jpg)

**C has a transitive dependency to A and B** because X needs A and B to function.

Now, imagine these dependencies are available at compile time, meaning
 
* X can use classes of A and B in its code, and
* C can use classes of X, A, and B in its code.

**The dependencies of X leak into the compile-time classpath of C**. This is what I'll call "dependency pollution".

<div class="notice success">
  <h4>Why are we only talking about compile-time dependencies?</h4>
  <p>
    This article only discusses the problems of too many compile-time dependencies and not those of 
    too many runtime dependencies. 
  </p>
  <p>  
    An unwanted compile-time
    dependency is more invasive because it allows binding the consumer's code to an external project, which may
    cause the problems discussed below.    
  </p>
  <p>
    An unwanted runtime dependency, on the other hand, will probably only bloat our final build artifact
    with a JAR file that we don't need (yes, there are scenarios in which a wrong runtime dependency
    can cause problems, but these are a completely different type of problem).
  </p>
</div> 

## Problems of Dependency Pollution

Let's talk about the implications of polluting the compile time of consumers with transitive dependencies. 

### Accidental Dependencies

The first problem that can easily occur is that of an accidental compile-time dependency.

For instance, the developer of C may decide to use some classes of library A in her code.
She may not be aware that A is actually a dependency of X and not a dependency of C itself, and the
IDE will happily provide her those classes to the classpath.

Now, the developers of X decide that with the next version of X, they no longer need library A.
They sell this as a minor update that is completely backward-compatible because
they haven't changed the API of X at all.

![A transitive dependency can change without us doing anything.](/assets/img/posts/gradle-dependency-pollution/explicit-dependency-error.jpg)

When the developer of C updates to this next version of X, **she will get compile errors even though the update of X 
has been backward-compatible** because the classes of A are no longer available. And 
**she hasn't even changed a single line of code**. 

Fact is, if we propagate our compile-time dependencies to our consumer's compile time, the consumer
may accidentally create compile-time dependencies she doesn't really want to have. And **she has to change
her code if some other project changes its dependencies**. 

She loses control over her code. 

### Unnecessary Recompiles

Now, imagine that A, B, C, and X are modules within our own project. 

**Every time there is a change in the code
of module A or B, module C has to be recompiled, even when module C doesn't even use the code of 
A or B**.

This is again because, through X, C has a transitive compile-time dependency to A and B. And the build tools
happily (and rightly) recompile all consumers of a module that was modified. 

This may not be an issue if the modules in a project are rather static. But if they are modified 
more often, this leads to unnecessarily long build times.  

### Unnecessary Reasons to Change

The problems discussed above boil down to a violation of the Single Responsibility Principle (SRP),
which, freely interpreted, says that **a module should have only one reason to change**. 

Let's interpret the SRP so that the one reason to change a module should be a change in the 
requirements of that module.

As we have seen above, however, **we might have to modify the code of C even if the requirements of C
haven't changed a bit**. Instead, we have given control over to the developers of A and B. If they change
something in their code, we have to follow suit.
   
If a module only has one reason to change, we keep control of our own code. With transitive compile-time
dependencies, we lose that control.

## Gradle's Solution

What support do today's build tools offer to avoid unwanted transitive compile-time dependencies?

With [Maven](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html#Dependency_Scope),
sadly, we have exactly the case outlined above. Every dependency in the [`compile` scope](/maven-scopes-gradle-configurations/#compile)
is copied to the `compile` scope of the [downstream](/upstream-downstream/#upstream-and-downstream-software-dependencies) consumer.

With Gradle, however, we have more control over dependencies, allowing us to reduce dependency
pollution.  

### Use the `implementation` Configuration

The solution Gradle offers is fairly easy. If we have a compile-time dependency, we add it
to the [`implementation` configuration](/maven-scopes-gradle-configurations/#implementation) 
instead of the `compile` configuration (which has been deprecated in favor of `implementation` for 
some time now).

![With Gradle's implementation configuration, compile-time dependencies are no longer transitive.](/assets/img/posts/gradle-dependency-pollution/explicit-dependency.jpg)

So, if the dependency of X to A is declared to the `implementation` configuration, **C no longer
has a transitive compile-time dependency to A**. C can no longer accidentally use classes of A.
If C needs to use classes of A, we have to declare the dependency to A explicitly.

If we *do* want to expose a certain dependency as a compile-time dependency, for example, if X uses
classes of B as part of its API, we have the
option to use the [`api` configuration](/maven-scopes-gradle-configurations/#api) instead. 

### Migrate from `compile` to `implementation`

If a module you're developing is still using the deprecated `compile`
configuration, consider it a service to your consumers to migrate to the newer `implementation`
configuration. It will reduce pollution to your consumers' compile-time classpath.

However, make sure to notify your consumers of the change, because they might have used some 
classes from your dependencies. Don't sell it as a backward-compatible update, because it will
be a breaking change at least for some.

The consumers will have to check if their modules still compile after the change. If they
don't, they were using a transitive dependency that is no longer available and they have to declare
that dependency themselves (or get rid of it, if it wasn't intentional).     

## Conclusion

If we leak our dependencies into our consumers' compile-time classpath, they may lose control
over their code. 

Keeping transitive dependencies in check so that they don't pollute consumer compile-time classpaths seems like
a daunting task, but it's fairly easy to do with Gradle's `implementation` configuration.
