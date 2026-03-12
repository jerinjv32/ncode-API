import dotenv from 'dotenv';
import DataBase from 'better-sqlite3';
import express, { Response, Request } from 'express';
import { InferenceClient } from "@huggingface/inference";

dotenv.config();
const app = express();
app.use(express.json());

const db = new DataBase('ncode_solutions.db', { verbose: console.log });

const client = new InferenceClient(process.env.HF_TOKEN);

async function chatBot(prompt: string) {
  const chatCompletion = await client.chatCompletion({
    model: "meta-llama/Llama-3.1-8B-Instruct:novita",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });
  return chatCompletion.choices[0].message;
}

function validation(storedSolution: string, clientSolution: string) {
  if (clientSolution == storedSolution) {
    return true;
  }
  else {
    return false;
  }
}

app.post('/api/chatBot', async (req: Request, res: Response) => {
  let data = req.body
  let response = await chatBot(data.prompt)
  res.json({ 'content': response.content })
});

app.post('/api/validator', (req: Request, res: Response) => {
  let data = req.body;
  let item = db.prepare('SELECT * FROM problem_solutions WHERE lesson_no=? ').get(data.lesson) as any;
  if (validation(item.solution, data.output)) {
    res.send('pass');
  }
  else {
    res.send('fail');
  }
});

export default app;
