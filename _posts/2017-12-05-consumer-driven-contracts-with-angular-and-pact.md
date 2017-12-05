---
title: "Creating a Consumer-Driven Contract from an Angular Client with Pact"
categories: [frameworks]
modified: 2017-12-05
author: tom
tags: [consumer, provider, contract]
comments: true
ads: false
---

Consumer-Driven Contract Tests are a technique to automatically test integration
points between API providers and API consumers (read it up in a 
[recent blog post](/7-reasons-for-consumer-driven-contracts/)).
A common use case for consumer-driven contract tests is testing interfaces between 
services in a microservice architecture. However, another interesting use case is
testing interfaces between the user client and those services. With [Angular](https://angular.io/)
being a widely adopted user client framework, this article takes a look on how to 
create consumer-driven contract tests between an Angular client and a REST backend.

# The Big Picture

![Mocking Overview](/assets/images/posts/consumer-driven-contract-with-angular-and-pact/mocks.jpg)

This article focuses on creating a contract and testing the Angular client against it.
The provider is left out for now.

The following steps assume that you set up an Angular Project with Angular CLI using
Karma as test runner and using the default testing framework provided by angular.

# Pact Dependencies

```
"@pact-foundation/pact-node": "^5.1.2",
"@pact-foundation/karma-pact": "~2.1.0",
"pact-web": "~3.0",
```

TODO: Peer dependency

# Configure Karma

```javascript
module.exports = function (config) {
  config.set({
    // ... other configurations
    pact: [{
      cors: true,
      port: 1234,
      consumer: "ui",
      provider: "userservice",
      dir: "pacts",
      spec: 2
    }],
    proxies: {
      '/user-service/': 'http://127.0.0.1:1234/user-service/'
    }
  });
};   
```

# The Test Subject: UserService

```typescript
@Injectable()
export class UserService {

  private BASE_URL = '/user-service/users';

  constructor(private httpClient: HttpClient) {
  }

  create(resource: User): Observable<number> {
    return this.httpClient
    .post(this.BASE_URL, resource)
    .map(data => data['id']);
  }

  update(resource: User, id: number): Observable<HttpResponse<any>> {
    return this.httpClient
    .put(`${this.BASE_URL}/${id}`, resource);
  }

  get(id: number): Observable<User> {
    return this.httpClient
    .get(`${this.BASE_URL}/${id}`);
  }

  list(page: number, pageSize: number = 10): Observable<Page<User>> {
    const params: HttpParams = new HttpParams();
    params.set('page', page.toString());
    params.set('pageSize', page.toString());
    const options = {
      params: params
    };
    return this.httpClient.get(this.BASE_URL, options);
  }
}
```

# Set up the Pact Test

```typescript
import * as Pact from 'pact-web';
```

```typescript
beforeAll(function (done) {
  provider = Pact({
    consumer: 'ui',
    provider: 'userservice',
    web: true,
    port: 1234,
    host: '127.0.0.1',
    logLevel: 'DEBUG'
  });

  // required for slower CI environments
  setTimeout(done, 2000);

  // Required if run with `singleRun: false`
  provider.removeInteractions();
});
```

```typescript
afterAll(function (done) {
  provider.finalize()
  .then(function () {
    done();
  }, function (err) {
    done.fail(err);
  });
});
```

# Create a Pact

```typescript
describe('create()', () => {

  const expectedUser: User = {
    firstName: 'Arthur',
    lastName: 'Dent'
  };

  const createdUserId = 42;

  beforeAll((done) => {
    provider.addInteraction({
      state: `provider accepts a new person`,
      uponReceiving: 'a request to POST a person',
      withRequest: {
        method: 'POST',
        path: '/user-service/users',
        body: expectedUser,
        headers: {
          'Content-Type': 'application/json'
        }
      },
      willRespondWith: {
        status: 201,
        body: Pact.Matchers.somethingLike({
            id: createdUserId
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    }).then(done, error => done.fail(error));
  });

  it('should create a Person', (done) => {
    const userService: UserService = TestBed.get(UserService);
    userService.create(expectedUser).subscribe(response => {
      expect(response).toEqual(createdUserId);
      done();
    }, error => {
      done.fail(error);
    });
  });

});
```

# The Pact

```json
{
  "consumer": {
    "name": "ui"
  },
  "provider": {
    "name": "userservice"
  },
  "interactions": [
    {
      "description": "a request to POST a person",
      "providerState": "provider accepts a new person",
      "request": {
        "method": "POST",
        "path": "/user-service/users",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "firstName": "Arthur",
          "lastName": "Dent"
        }
      },
      "response": {
        "status": 201,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "id": 42
        },
        "matchingRules": {
          "$.body": {
            "match": "type"
          }
        }
      }
    }
  ],
  "metadata": {
    "pactSpecification": {
      "version": "2.0.0"
    }
  }
}
```

# Bonus: Publish the Contract on a Pact Broker

```typescript
let projectFolder = __dirname;
let pact = require('@pact-foundation/pact-node');
let project = require('./package.json');

let options = {
  pactUrls: [projectFolder + '/pacts'],
  pactBroker: 'https://your.pact.broker.url',
  consumerVersion: project.version,
  tags: ['latest'],
  pactBrokerUsername: 'YOUR_PACT_BROKER_USER',
  pactBrokerPassword: 'YOUR_PACT_BROKER_PASS'
};

pact.publishPacts(options).then(function () {
  console.log("Pacts successfully published!");
});
```
