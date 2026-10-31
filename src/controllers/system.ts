import type { Request, Response } from 'express';
import { HealthResponse } from '@/types/index.js';
import bcrypt from 'bcryptjs';
import prisma from '../db.js';

// GET /api/system/health - Static application metric check
export const getSystemHealth = (req: Request, res: Response<HealthResponse>) => {
  res.status(200).json({
    status: 'OK',
    message: 'Data processed through the Express Controller successfully!'
  });
};

// GET /api/system/activities - Read your live data stream logs from MariaDB
export const getActivities = async (req: Request, res: Response) => {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(activities);
  } catch (error: any) {
    res.status(500).json({ error: 'Database read operation failed' });
  }
};

// POST /api/system/activities - Write a brand new state mutation log entry
export const createActivity = async (req: Request, res: Response) => {
  const { title } = req.body;
  const activeUserId = req.user?.id; // Grabs active context identity safely from your parser layer
  
  if (!title) {
    res.status(400).json({ error: 'Title property is required' });
    return;
  }

  try {
    const newActivity = await prisma.activity.create({
      data: { 
        title,
        userId: activeUserId // Automatically maps logs to active creator accounts if signed in
      }
    });
    
    res.status(201).json(newActivity);
  } catch (error: any) {
    res.status(500).json({ error: 'Database write operation failed' });
  }
};

// GET /api/system/widgets - Fetches all layout control text blocks from MariaDB
export const getWidgetControls = async (req: Request, res: Response) => {
  try {
    const controls = await prisma.widgetControl.findMany();
    res.status(200).json(controls);
  } catch (error: any) {
    res.status(500).json({ error: 'Database read operation failed for widget controls' });
  }
};

// POST /api/system/widgets/seed - Emergency initializer to seed default cards text if empty
export const seedWidgetControls = async (req: Request, res: Response) => {
  try {
    await prisma.widgetControl.upsert({
      where: { controlKey: 'home-hub-card' },
      update: {},
      create: {
        controlKey: 'home-hub-card',
        heading: 'Dynamic Home Hub',
        bodyText: 'This welcome text is streaming live from your local MariaDB database!'
      }
    });

    await prisma.widgetControl.upsert({
      where: { controlKey: 'server-metrics-card' },
      update: {},
      create: {
        controlKey: 'server-metrics-card',
        heading: 'Live Infrastructure Logs',
        bodyText: 'Monitor your active Express microservices and track database persistence structures.'
      }
    });

    res.status(200).json({ message: 'Database widget configurations seeded successfully!' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to seed widget text blocks', details: error.message });
  }
};

// DELETE /api/system/activities/:id - Removes a specific logging entry from MariaDB
export const deleteActivity = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (typeof id !== 'string') {
    res.status(400).json({ error: 'Invalid or missing unique identification parameter' });
    return;
  }

  try {
    await prisma.activity.delete({
      where: { id }
    });
    res.status(204).end();
  } catch (error: any) {
    res.status(500).json({ error: 'Database delete operation failed', details: error.message });
  }
};

// GET /api/users - Retrieve all registered profiles from MariaDB (Excludes sensitive hashes)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Database read failed for users layout maps' });
  }
};

// POST /api/system/users - Provision a brand new user profile record
export const createUser = async (req: Request, res: Response) => {
  const { username, displayName, email, role, password } = req.body;

  if (!username || !displayName || !email) {
    res.status(400).json({ error: 'Missing required user creation field mappings' });
    return;
  }

  try {
    /* Hash the incoming raw text password parameter with a 10-round cryptographic salt factor */
    const rawPassword = password ? password.trim() : 'defaultpassword';
    const encryptedPassword = await bcrypt.hash(rawPassword, 10);

    const newUser = await prisma.user.create({
      data: { 
        username: username.trim(), 
        displayName: displayName.trim(), 
        email: email.trim().toLowerCase(), 
        role,
        /* Bind the secure hashed password string value to your database write operation */
        password: encryptedPassword
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create user record', details: error.message });
  }
};

// PATCH /api/system/users/:id - Edit an existing profile or change clearance roles
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { displayName, email, role, password } = req.body;

  if (typeof id !== 'string') {
    res.status(400).json({ error: 'Missing valid user unique index identifier' });
    return;
  }

  try {
    /* Initialize a placeholder variable for our password modification parameter */
    let encryptedPassword = undefined;

    /* Generate a fresh cryptographic hash only if a password string is explicitly supplied */
    if (password && password.trim() !== '') {
      encryptedPassword = await bcrypt.hash(password.trim(), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { 
        ...(displayName && { displayName: displayName.trim() }),
        ...(email && { email: email.trim().toLowerCase() }),
        ...(role && { role }),
        /* Feed the hashed password string to the Prisma modification data payload if present */
        ...(encryptedPassword !== undefined && { password: encryptedPassword })
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    res.status(200).json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user record', details: error.message });
  }
};

// DELETE /api/system/users/:id - Removes a specific user profile from MariaDB (Restricted to Admin)
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user;

  if (typeof id !== 'string') {
    res.status(400).json({ error: 'Missing valid user unique identifier' });
    return;
  }

  // Self-Deletion Security Guard: Prevent the active Admin from locking themselves out!
  if (currentUser && currentUser.id === id) {
    res.status(400).json({ error: 'Self-deletion is forbidden. You cannot delete your own active administrator profile.' });
    return;
  }

  try {
    await prisma.user.delete({
      where: { id }
    });
    res.status(204).end();
  } catch (error: any) {
    res.status(500).json({ error: 'Database delete operation failed for user record', details: error.message });
  }
};
