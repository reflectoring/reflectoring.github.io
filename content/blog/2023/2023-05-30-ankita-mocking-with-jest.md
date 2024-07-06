Mocking is a technique in software testing that allows us to create simulated objects or functions that mimic the behavior of real ones. By creating these "mocks", we can test our code in isolation and ensure that it works as expected, without having to rely on external dependencies or systems.

Jest is a popular testing framework, created by Meta. It includes a powerful mocking library that allows us to easily create mocks. It provides us with a variety of tools such as mock functions, mock modules, and spies. Jest's mocking library makes it easy to set up and use mocks in our tests, reducing the time and effort required to write effective unit tests. 

Ultimately, this allows us to test our code more reliably and catch bugs earlier in the development process.

## Why is Mocking Important?

Mocking is used primarily in unit testing, so let’s take minute to understand the importance of unit tests. 

Unit tests are a type of software testing that focus on testing individual units, or small pieces of code, in isolation from the rest of the system. The purpose of unit testing is to ensure that each unit of code works correctly and meets its intended functionality. To achieve this isolation, we use mocking. 

Aside from achieving code isolation, mocking ensures that our tests are reproducible, improves test coverage and allows rapid testing. In this article, we'll explore how we can achieve this with our tests too.

Not using mocking in unit tests can lead to some significant drawbacks. First and foremost, it can make our tests flaky and slow. This happens because the tests are not isolated, meaning they depend on external factors such as network calls or database connections. As a result, the tests may fail even when the code being tested is correct, making it harder to debug issues. Moreover, this can make the feedback loop slower, making it less likely that developers will run the tests frequently or with enough coverage.

Let’s say that we’re building a weather app. Here, we have a simple project structure:

```shell
│   ├── weatherApp/
│       └── app.js
│       └── weather.js
│       ├── tests/
│           └── app.test.js
│           └── weather.test.js
```

Let’s take a look at the weather module.

*weather.js*

```js
export const getCurrentTemprature = (city) => {
	const data = fetchWeatherDataFromExternalAPI(city);
    return data.temprature
};

export const getHighestTemprature = (city) => {
	const data = fetchWeatherDataFromDatabase(city);
	return data.temprature;
};

// Helper functions
export const fetchWeatherDataFromExternalAPI = (city) => {
    /* fetch data from external api */
	return data;
};

export const fetchWeatherDataFromDatabase = () => {
	/* fetch data from database */
	return data;
};
```

There are some key things to note in the above code. 

- The weather module makes an external API call to get the current temperature of a city. This API will not return the same information every time as the temperature constantly fluctuates, thereby introducing flakiness into the tests. 
- Similarly, a database call is made to fetch the highest temperature of a city. This means that we would need access to a database in order to test this function. This could result in slowness and the added overhead of creating a database every time we want to run some basic unit tests. 

These problems can be resolved by mocking the **fetchWeatherDataFromExternalAPI** and **fetchWeatherDataFromDatabase** functions!

```js
// Without mocking
it('returns the correct current temprature for San Francisco', () => {
  const weatherData = getCurrentTemprature('San Francisco');
  expect(weatherData.temperature).toBeGreaterThan(0);
});

// With mocking
it('returns the correct current temprature for San Francisco', () => {
  const mockApi = {
    fetchWeatherDataFromExternalAPI: jest.fn(() => ({ temperature: 20 })),
  };
  const weatherData = getCurrentTemprature('San Francisco', mockApi);
  expect(mockApi.fetchWeatherDataFromExternalAPI).toHaveBeenCalledWith('San Francisco');
  expect(weatherData.temperature).toBeGreaterThan(0);
});
```

## The Basics of Jest Mocking

Let’s understand the basics of mocking with Jest. 

Mock functions are functions that replace the implementation of a real function with a mock implementation. They can be used to simulate different behavior and return values from the function being mocked. It gives the developer complete control over their testing strategy.

Jest provides several methods to create mock functions. The main ones are:

- jest.fn()
- jest.mock()
- jest.spyOn().

**jest.fn()** is a method that creates a new, empty mock function that you can use to replace a real function in your tests. Once we’ve mocked a function, we can also mock its return value using the **mockReturnValue()** menthod. 

Let’s see this in action in the following example.

*`weather.test.js`*

```js
import { 
	fetchWeatherDataFromExternalAPI,
	fetchWeatherDataFromDatabase,
	getCurrentTemprature,
	getHighestTemprature
} from '../weather.js';

const jest = require('jest');

fetchWeatherDataFromExternalAPI = jest.fn();
fetchWeatherDataFromDatabase = jest.fn();

it("getCurrentTemprature for San Francisco", () => {
    fetchWeatherDataFromExternalAPI.mockResolveValue({
		temprature: 20,
	});
	
	const response = getCurrentTemprature('San Francisco');

	expect(response).to.equal(20);
	expect(response).toBeGreaterThan(0);
});

it("getHighestTemprature for San Francisco", () => {
    fetchWeatherDataFromDatabase.mockReturnValue({
		temprature: 40,
	});
	
	const response = getHighestTemprature('San Francisco');

	expect(response).to.equal(40);
	expect(response).toBeGreaterThan(0);
});
```

We can also mock the implementation of a function by using the **mockImplementation()** method or by passing the function implementation as an argument to **jest.fn()**. If our mocked function returns a promise, we can mock its resolved value using the **mockResolveValue()** method.

We could have also mocked the implementation of the *fetchWeatherDataFromExternalAPI* function in the following ways:

```js
fetchWeatherDataFromExternalAPI = jest.fn((city) => {
	if ('San Francisco') return 20;
	else return 10;
});

// OR

fetchWeatherDataFromExternalAPI = jest.fn();
fetchWeatherDataFromExternalAPI.mockImplementation((city) => {
	if ('San Francisco') return 20;
	else return 10;
});
```

So far, we've learned how to mock individual functions. However, this is not all we can do with Jest. We can also mock entire modules using **jest.mock()**. This saves us many unnecessary lines of code by allowing us to mock all the functions in a module with one powerful command.

Consider the following code:

*`app.js`*

```js
import { 
	getCurrentTemprature,
	getHighestTemprature
} from './weather.js';

export const getWeatherInfo = (city) => {
	const currentTemprature = getCurrentTemprature(city);
	const highestTemprature = getHighestTemprature(city);
	return {
		current: currentTemprature,
		highest: highestTemprature
	};
};
```

Here, we can mock the entire weather.js module as follows:

*`app.test.js`*

```js
import { getWeatherInfo } from '../app.js';
import { 
	getCurrentTemprature,
	getHighestTemprature
} from '../weather.js';

const jest = require('jest');

jest.mock("../weather.js");

it("getWeatherInfo for San Francisco", () => {
  getWeatherInfo('San Francisco');

	expect(getCurrentTemprature).toHaveBeenCalledWith('San Francisco');
	expect(getHighestTemprature).toHaveBeenCalledWith('San Francisco');
});
```

**jest.mock()** sets all the functions in the mocked module to jest.fn(). Without **jest.mock()**, we would need to create individual mocks for **getCurrentTemprature** and **getHighestTemprature**

If we also want to mock the implementations of these functions, then use can use something called **manual mocking**. To do this, we can create a manual mock of a module by creating a file with the same name as the module you want to mock, and placing it in a __mocks__ directory. In this file, we can define a function with the same name as the function you want to mock, and export it. 

```shell
│   ├── weatherApp/
│       └── app.js
│       └── weather.js
│       ├── tests/
│           └── __mocks__
│               └── weather.js
│           └── app.test.js
│           └── weather.test.js
```

*`__mocks__/weather.js`*

```js

getCurrentTemprature = jest.fn();
getCurrentTemprature.mockImplementation((city) => {
	if ('San Francisco') return 20;
	else return 10;

getCurrentTemprature = jest.fn();
getCurrentTemprature.mockImplementation((city) => {
	if ('San Francisco') return 40;
	else return 30;

```

Now, we don't need to mock these functions in the **app.test.js** file.

*`app.test.js`*

```js
import { getWeatherInfo } from '../app.js';
import { 
	getCurrentTemprature,
	getHighestTemprature
} from '../weather.js';


it("getWeatherInfo for San Francisco", () => {
    getWeatherInfo('San Francisco');

	expect(getCurrentTemprature).toHaveBeenCalledWith('San Francisco');
	expect(getHighestTemprature).toHaveBeenCalledWith('San Francisco');
});
```

Now, let’s say we don’t want to mock a function, rather just spy on the existing function to see how many times it was call and what value it returned, then we can use jest.spyOn(). 

This method still mocks the function, but does so internally.

## How to Use Jest for Effective Mocking?

When it comes to writing effective unit tests with Jest's mocking library, there are some best practices to keep in mind. Additionally, Jest provides a number of configuration options that can help you optimize your mocking strategies.

A. Best Practices for Writing Mock Functions and Modules

1. Keep your mocks simple and focused: Mocks should only implement the behavior necessary for your test. Avoid adding additional functionality that's not needed, as it can make your mocks harder to maintain.
2. Use descriptive names for your mock functions: Name your mock functions in a way that clearly indicates their purpose, such as **`fetchUser`** or **`saveData`**.
3. Avoid overuse of mock functions: While mock functions are useful for isolating your code for testing purposes, overusing them can lead to brittle tests that are tightly coupled to implementation details.
4. Use **`jest.spyOn()`** to mock methods on an object: Instead of using **`jest.fn()`** to create a mock function, you can use **`jest.spyOn()`** to create a mock function that replaces a specific method on an object. This can be especially useful when testing code that relies heavily on third-party libraries.
5. Avoid mocking implementation details: Mock only the external dependencies that your code relies on, not the implementation details of your own code.

B. How to Configure Jest for Optimal Mocking

Jest provides a number of configuration options that can help optimize your use of its mocking library. Here are a few examples:

1. **`jest.mock()`** options: When using **`jest.mock()`** to mock modules, you can pass additional options to configure the behavior of the mock. For example, you can use the **`virtual`** option to create a virtual module that doesn't exist on the file system.
2. **`resetMocks`** option: Jest provides a **`resetMocks`** configuration option that allows you to reset all your mocks before each test, ensuring a clean slate for each test.
3. **`restoreMocks`** option: Similar to **`resetMocks`**, the **`restoreMocks`** configuration option can be used to restore any mocks that were made during a test to their original implementation.
4. **`clearMocks`** option: The **`clearMocks`** configuration option clears all mock data after each test, allowing you to avoid unexpected behavior caused by leftover mock data.


## Conclusion

In conclusion, mocking is a crucial technique in software testing that enables software developers to create simulated objects or functions to mimic the behavior of real ones. It plays a significant role in unit testing, allowing developers to test code in isolation without relying on external dependencies or systems. Jest, a popular testing framework created by Meta, offers a powerful mocking library that simplifies the process of creating and using mocks.

By employing mocking techniques, developers can achieve code isolation, improve test coverage, and enable rapid testing. Without mocking, tests can become flaky and slow, relying on external factors like network calls or database connections. This lack of isolation can lead to false failures and hinder the debugging process. 

Through practical examples, in this article, we've seen how to utilize Jest's mocking library effectively. We learned the use of mock functions, mock modules, and spies. We learned how to use mock functions to replace the implementation of real functions and how to mock entire modules.

To ensure effective mocking, we learned about certain best practices such as keeping mocks simple and focused, using descriptive names, and avoiding overuse of mock functions. Additionally, we also learned about several configuration options provided by Jest for optimizing mocking strategies. 

Overall, leveraging Jest's mocking capabilities empowers developers to write reliable and comprehensive unit tests, leading to more robust code, early bug detection, and improved software quality.