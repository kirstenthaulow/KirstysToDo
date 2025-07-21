import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input } = await req.json();

    if (!input || typeof input !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Input text is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are a task parsing assistant. Parse the user's natural language input into structured task data.

Return a JSON object with these fields (only include fields that can be extracted from the input):
- title: string (required - the main task title)
- description: string (optional - additional details)
- priority: "low" | "medium" | "high" | "urgent" (optional - based on urgency keywords)
- tags: string[] (optional - relevant categories like "work", "personal", "health", etc.)
- dueDate: ISO string (optional - if a date/time is mentioned)
- reminderMinutes: number (optional - minutes before due date to remind, default 15 if reminder is mentioned)

Examples:
Input: "Dentist appointment Friday at 3pm"
Output: {"title": "Dentist appointment", "tags": ["health", "appointment"], "dueDate": "2024-01-26T15:00:00.000Z", "reminderMinutes": 15}

Input: "Urgent: finish essay by tomorrow"
Output: {"title": "Finish essay", "priority": "urgent", "tags": ["school", "assignment"]}

Be concise and extract only what's clearly mentioned in the input.`
          },
          { role: 'user', content: input }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    let parsedTask;
    
    try {
      parsedTask = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      // If JSON parsing fails, create a basic task from the input
      parsedTask = {
        title: input.slice(0, 100), // Use first 100 chars as title
        description: input.length > 100 ? input : undefined
      };
    }

    return new Response(JSON.stringify(parsedTask), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in parse-task-with-ai function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to parse task' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
