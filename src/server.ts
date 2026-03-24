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

function cachedRequest(prompt: string) {
  try {
    let result = db.prepare('SELECT response FROM cached_requests WHERE prompt=? ').get(prompt) as any
    if (result) {
      return result.response
    }
    else {
      return false
    }
  }
  catch (e) {
    console.log('DB Error:', e);
  }
}

function validation(storedSolution: string, clientSolution: string) {
  try {
    if (clientSolution.search(new RegExp(storedSolution, 's')) != -1) {
      return true
    }
    else {
      return false
    }
  }
  catch (e) {
    console.error('Validation Error:', e);
  }
}

app.post('/api/chatBot', async (req: Request, res: Response) => {
  let data = req.body
  let available = cachedRequest(data.prompt)
  try {
    if (!available) {
      let response = await chatBot(data.prompt)
      db.prepare('INSERT INTO cached_requests (prompt, response) VALUES (?, ?)').run(data.prompt, response.content)
      res.json({ 'content': response.content });
    }
    else {
      res.json({ 'content': available })
    }
  } catch (e) {
    console.error('Insertion Error:', e)
  }
});

app.post('/api/validator', (req: Request, res: Response) => {
  let data = req.body;
  let lessonNo = data.lesson
  console.log(typeof lessonNo)
  let output = String(data.output)
  let item = db.prepare('SELECT * FROM problem_solutions WHERE lesson_no=? ').get(data.lesson) as any;
  if (validation(item.solution, output)) {
    res.send('pass');
  }
  else {
    res.send('fail');
  }
});

app.post('/api/hints', async (req: Request, res: Response) => {
  let data = req.body;
  let question = `A help on question which to be solved in python 3 is asked here. Guide them how they can solve this question within maximum
   of 3 lines. Do not explain about how to install, do not include potential problems, do not add any greetings, act like wall which only returns
   what it was asked, only answer as mentioned. The question might include info regarding an image, but only guide them through the question provide.
   The image is irrelavent to your answer. So, do not mention about reading the images or similar things. And, the image given to the user will not
   contain any mention of syntax nor will contain any code snippets. So, do not expect them to figure out from it. Give them hints not answer. Again:
   1. Maximum of 3 lines of response.
   2. Do not provide direct answer.
   3. Only provide them hints of funcion or method to use which are inherentily available in python.
   4. They will be beginners; therefore keep the hints as basic as possible.
   5. Sometimes will be like riddles if couldn't understand, only mention about how to crack the question.
   6. Do not provide any instruction to install any packages, libraries or anything.
   7. If no solution was able to figure out by you then just tell them to use a pen and book. And try visualize the problem.
   8. Do not mention about modules like speech recognition or image recognition or anything stick to basic stuff. Like literal basic python concepts.
   9. Do not provide any direct code snippets example : print('hello') or anything like that, keep it to sentances only.
   This the question: ` + data.question;
  let response = await chatBot(question);
  res.json({ 'content': response.content });
});

export default app;
