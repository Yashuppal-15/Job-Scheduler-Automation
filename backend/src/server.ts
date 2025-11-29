import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001',
    'https://job-scheduler-automation-psi.vercel.app/'
  ],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// 1. CREATE JOB
app.post('/jobs', async (req: Request, res: Response) => {
  try {
    const { taskName, payload, priority } = req.body;

    if (!taskName || !payload) {
      return res.status(400).json({ error: 'taskName and payload are required' });
    }

    const job = await prisma.job.create({
      data: {
        taskName,
        payload,
        priority: priority || 'Medium',
        status: 'pending',
      },
    });

    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// 2. GET ALL JOBS WITH FILTERS
app.get('/jobs', async (req: Request, res: Response) => {
  try {
    const { status, priority } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// 3. GET JOB BY ID
app.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid job id' });
    }

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// 4. RUN JOB (simulate 3s + webhook)
app.post('/run-job/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid job id' });
    }

    const existing = await prisma.job.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // set status running
    await prisma.job.update({
      where: { id },
      data: { status: 'running' },
    });

    res.json({ message: 'Job started', jobId: id });

    // async worker
    setTimeout(async () => {
      try {
        const completedJob = await prisma.job.update({
          where: { id },
          data: { status: 'completed' },
        });

        const webhookUrl = process.env.WEBHOOK_URL;
        if (!webhookUrl) {
          console.warn('WEBHOOK_URL not set, skipping webhook');
          return;
        }

        const response = await axios.post(webhookUrl, {
          jobId: completedJob.id,
          taskName: completedJob.taskName,
          priority: completedJob.priority,
          payload: completedJob.payload,
          completedAt: new Date().toISOString(),
        });

        await prisma.job.update({
          where: { id },
          data: { webhookLog: JSON.stringify(response.data) },
        });

        console.log('Webhook sent successfully');
      } catch (err) {
        console.error('Error during job completion/webhook:', err);
      }
    }, 3000);
  } catch (error) {
    console.error('Error running job:', error);
    res.status(500).json({ error: 'Failed to run job' });
  }
});

// OPTIONAL: DELETE JOB
app.delete('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid job id' });
    }

    const deleted = await prisma.job.delete({ where: { id } });

    res.json({ message: 'Job deleted', job: deleted });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
