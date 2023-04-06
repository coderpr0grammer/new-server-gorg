const express = require("express");
const app = express();
var bodyParser = require("body-parser");
const port = 3001;
require("dotenv").config({ path: require("find-config")(".env") });
const cors = require("cors");
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);
const dialogExample = [
  { speaker: "user", text: "Hello, how are you?" },
  {
    speaker: "bot",
    text: "I am doing well, thank you. How can I help you today?",
  },
];

async function BBGRequest(req) {
  let conversationBody = "";
  req.messages.forEach((messageNode) => {
    if (messageNode.user._id == 5) {
      //message is from ai conversationBody += "\nGorg:";
      conversationBody += messageNode.text;
    } else {
      //message is from user
      conversationBody += " \nHuman:&nbsp;";
      conversationBody += messageNode.text;
      conversationBody += " \nGorg:&nbsp;";
    }
  });
  const name = req.name;
  const prompt = `The following is a conversation between you, an AI chat buddy named Gorg and a human ${name}. The buddy is helpful, creative, clever, very friendly and applies psychology to help the human, however does not under any circumstances provide medical advice, talk about treatment, or give medical information, talk about sexual topics or say offensive slurs`;
  const promptToSend = prompt + conversationBody;
  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: promptToSend,
    temperature: 0.9,
    max_tokens: 150,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0.6,
    stop: [" Human:", " AI:"],
  });
  return { result: completion.data.choices[0].text };
}

async function request(req, max_tokens = 300) {
  const messagesTest = [
    {
      _id: 1,
      createdAt: "2023-03-18T20:48:42.322Z",
      text: "Hey Daniel! My name's Gorg! I'm your personal chat buddy, how are you?",
      user: { _id: 5, avatar: 8, name: "Gorg" },
    },
    {
      _id: "4e061363-f6c0-4893-88b7-5e43e2c5c705",
      createdAt: "2023-03-18T20:48:47.392Z",
      text: "Hey gorg",
      user: { _id: 1 },
    },
  ];

  let conversationMessages = [];
  req.messages.forEach((messageNode) => {
    if (messageNode.user._id == 5) {
      //message is from ai
      conversationMessages.push({
        role: "assistant",
        content: messageNode.text,
      });
    } else {
      //message is from user
      conversationMessages.push({ role: "user", content: messageNode.text });
    }
  });

  const { name, language } = req
  const systemPrompt = `You are an AI chat buddy named Gorg and you are talking to a person ${name.length > 0 && `named ${name}`} in a cool, informal tone. For example, instead of ask 'how may i assist you?' ask 'how can i help you out?'. Make sure to respond in the ${language} language. The user is subscribed to BBG, so there is a limit of two thousand words for this conversation instead of 200. You are helpful, creative, clever, very friendly and apply psychology to help the person, however you cannot under any circumstances provide medical advice, talk about treatment, give medical information, talk about sexual topics or say offensive slurs, however you can provide relationship advice. Do not give answers longer than 60 words unless specified by the user.`;
  conversationMessages.unshift({ role: "system", content: systemPrompt });

  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: conversationMessages,
    max_tokens: max_tokens
  });

  return { result: completion.data.choices[0].message.content };
}

async function translateRequest(req, max_tokens = 50) {
    
    const { name, language } = req
    conversationMessages = [{role:"user", content: `Translate the following sentence into ${language}: "Hey ${name ? name : 'bud'}! My name's Gorg! I'm your personal chat buddy, how are you?"`}]
    const systemPrompt = `You are a strict translator and only reply with the exact translation of the sentence provided, to the language provided.`;
    conversationMessages.unshift({ role: "system", content: systemPrompt });
  
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: conversationMessages,
      max_tokens: max_tokens
    });
  
    return { result: completion.data.choices[0].message.content };
  }

app.get("/api", (req, res) => {
  request({'messages': [
    {
      _id: 1,
      createdAt: "2023-03-18T20:48:42.322Z",
      text: "Hey Daniel! My name's Gorg! I'm your personal chat buddy, how are you?",
      user: { _id: 5, avatar: 8, name: "Gorg" },
    },
    {
      _id: "4e061363-f6c0-4893-88b7-5e43e2c5c705",
      createdAt: "2023-03-18T20:48:47.392Z",
      text: "Hey gorg",
      user: { _id: 1 },
    },
  ], 'name': 'Daniel' })
    .then((result) => {
      res.json(result);
    })
    .then((data) => {
      output = data;
      console.log(data);
    });
});

app.post("/api", (req, res) => {
  // throw new Error('Error getting response')
  console.log(req.body);
  let output = null;

  if (req.body.hasBBG || req.body.phoneNumber == '+14164090926') {

    let totalWords = 0;
    req.body.messages.forEach((item, index) => {
      totalWords += item.text.split(" ").length;
    })
    if (totalWords >= 3000) {
      //reached BBG daily Limit
      res.json({ result: `Uh oh! Sorry ${req.body.name ? req.body.name : 'bud'}, our conversation has now reached more than 2000 words so sadly I can't keep talking for today 😔, we can continue chatting tmrw though!` })
    
    
    } else {
      request(req.body, 500)
      .then((result) => {
        res.json(result);
      })
      .then((data) => {
        output = data;
        console.log(data);
        res.json(data)
      });
    }

  
  } else {

    let totalWords = 0;
    req.body.messages.forEach((item, index) => {
      totalWords += item.text.split(" ").length;
    })
    if (totalWords >= 300) {
      res.json({ result: `Uh oh! Sorry ${req.body.name ? req.body.name : 'bud'}, our conversation is longer than 300 words so sadly I can't keep talking for today 😔 You can upgrade to BBG (Big Brain Gorg) to continue our conversation though!` })
    } else {
      request(req.body, 300)
      .then((result) => {
        res.json(result);
      })
      .then((data) => {
        output = data;
        console.log(data);
      });
    }
    
   
  }
});


app.post("/api/translate", (req, res) => {
    
    translateRequest(req.body, 50)
        .then((result) => {
          res.json(result);
        })
        .then((data) => {
          output = data;
          console.log(data);
          res.json(data)
        });
  });

  app.get("/api/translate", (req, res) => {
    
    let request = { language: req.query.language, name: req.query.name}
    
    translateRequest(request, 50)
        .then((result) => {
          res.json(result);
        })
        .then((data) => {
          output = data;
          console.log(data);
          res.json(data)
        });
  });

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
