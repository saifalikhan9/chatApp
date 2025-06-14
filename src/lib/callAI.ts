// import { config } from "./config";

// export default async function callAI(context: string): Promise<string> {
//   console.log("herer");

//   const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Authorization": `Bearer ${config.API_KEY}`,
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify({
//       model: "gpt-4",
//       messages: [
//         { role: "system", content: "Summarize these messages and highlight key points." },
//         { role: "user", content: context }
//       ]
//     })
//   });
//   console.log("here inappi");

//   const data = await response.json();
//   return data.choices[0].message.content;
// }

// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import { GoogleGenAI } from "@google/genai";
import { config as configs } from "./config";

export async function main(context: string) {
  const ai = new GoogleGenAI({
    apiKey: configs.API_KEY,
  });
  const config = {
    responseMimeType: "text/plain",
  };
  const model = "gemini-2.5-flash-preview-05-20";
  const contents = [
    {
      role: "system",
      text: "Explain all these unread message in one or two lines",
    },
    { role: "user", text: context },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });
  let fileIndex = 0;
  for await (const chunk of response) {
    console.log(chunk.text);

    return chunk.text;
  }
}
