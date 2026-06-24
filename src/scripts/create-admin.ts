import { createInterface } from 'readline';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { Role } from '../database/entities';

// Function to prompt for input
async function getUserInput() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const question = (str: string) =>
    new Promise<string>((resolve) => rl.question(str, resolve));

  const name = await question('Enter first name: ');
  const username = await question('Enter username: ');
  const phone = await question('Enter phone (optional): ');
  const password = await question('Enter password: ');

  rl.close();
  return { name, username, phone: phone || null, password };
}

async function createAdmin() {
  // Get user input from the console
  const adminDto = await getUserInput();

  // Create a NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    // Attempt to create the admin user
    const adminUser = await usersService.createByAdmin(
      {
        ...adminDto,
        role: Role.ADMIN,
      },
      null,
    );
    console.log('Admin user created successfully:', adminUser);
  } catch (error) {
    // Check if admin already exists
    const existingAdmin = await usersService.findByUsername(adminDto.username);
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin);
    } else {
      console.error('Error creating admin user:', error);
    }
  }

  // Close the app context
  await app.close();
}

void createAdmin();
