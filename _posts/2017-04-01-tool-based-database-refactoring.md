---

title: Tool-based Database Refactoring
categories: [craft]
modified: 2017-04-01
excerpt: "A short introduction to database refactoring and an argument why a database 
          refactoring tool is a must-have in any project using a database with a schema."
image: 0046-rack
---



The term "refactoring" is well defined in software development. It is usually used
to describe a restructuring of source code ranging from simply renaming a variable
to completely re-thinking whole components or applications.

However, the term "refactoring" is rarely used when talking about restructuring database
schemas. But databases are a very important part in most (web) applications
developed today. And the structure of a database changes almost as often as
the code itself. Thus, a refactoring of the database structure should be done just as careful
as refactoring the source code.

## 2nd Class Database Refactoring
Usually, when a change in the source code requires a change in the database schema
we create an SQL script that makes that change (e.g. adding or removing a table
or a column in a table). In the best case, that script is put into version control
next to the source code of the application. 

When releasing a new version of the application, we now have to remember to 
run that script on the target database (and all other scripts that have accumulated
in the meantime). Commonly, this is a manual step during the release and thus is
prone to error. 

While source code is a first class citizen, SQL scripts are often
being neglected. All because we want to create features with business value
instead of handling SQL scripts.

## Database Refactoring Done Right
Yes, we want to create business value. But why not make our lives easier by
automating database refactoring with a tool? Everything that runs automatically
prevents errors and saves time in the long run which we can use to develop
features for the business. So, how does an automated database refactoring
look like?

First, we have to collect changes to the database schema as described above.
Depending on which tool we use, these changes are described in SQL, XML, JSON or
YAML, for example. These scripts are being numbered and put into version 
control, just like described above. 

The difference to the naive approach of manual database refactoring is that
we use a tool to apply the scripts to a target database. When we want to
update a target database, we simply run a command and the tool executes
all scripts for us. A big plus here is that the tool knows which scripts
have already run on the target database and only executes those scripts that
have not yet been run. Usually, the tool uses a separate database table to
store that information.

Another feature of a database refactoring tool is an integrity check on the
scripts. If a script has already been run on a target database, then changed
and then the tool is run again, it will fail with an error message. This
prevents having diverging database schema versions on different target databases.
For this integrity check, the database refactoring tools usually store a
hash value of the scripts in a special database table.

## Tools
A database refactoring tool does nasty manual labor for us and reduces the risk
of having diverging database schemas on different server environments. Pretty good
arguments. 

Two commonly used database refactoring tools are [Liquibase](http://www.liquibase.org/) 
and [Flyway](https://flywaydb.org/). Both
are written in Java, but need only minimal Java knowledge to be run and thus
qualify for non-Java projects. As usual, each has a set of advantages and 
disadvantages which will be discussed in a future blog post.




