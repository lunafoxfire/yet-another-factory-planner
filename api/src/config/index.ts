import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}
