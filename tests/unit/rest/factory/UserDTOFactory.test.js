import { UserDTOFactory } from '../../../../src/rest/factory/UserDTOFactory.js';
import { RegisterRequest } from '../../../../src/rest/request/RegisterRequest.js';

describe('UserDTOFactory', () => {
  let factory;

  beforeEach(() => {
    factory = new UserDTOFactory();
  });

  it('getRegisterData extracts username, email, password from RegisterRequest', () => {
    const request = new RegisterRequest({
      username: 'mario',
      email: 'mario@test.it',
      password: 'password123'
    });

    const data = factory.getRegisterData(request);

    expect(data).toEqual({
      username: 'mario',
      email: 'mario@test.it',
      password: 'password123'
    });
  });

  it('getRegisterData handles null fields', () => {
    const request = new RegisterRequest();
    const data = factory.getRegisterData(request);
    expect(data).toEqual({
      username: null,
      email: null,
      password: null
    });
  });

  it('getRegisterData passes through empty strings', () => {
    const request = new RegisterRequest({ username: '', email: '', password: '' });
    const data = factory.getRegisterData(request);
    expect(data).toEqual({
      username: '',
      email: '',
      password: ''
    });
  });
});
