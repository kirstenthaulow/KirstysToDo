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

    console.log('Sending request to OpenAI with input:', input);
    
    if (!openAIApiKey) {
      console.error('OpenAI API key is not set');
      throw new Error('OpenAI API key is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { 
            role: 'system', 
            content: `You are a task parsing assistant. Parse the user's natural language input into structured task data.

CURRENT CONTEXT:
- Today's date: ${new Date().toISOString().split('T')[0]}
- Current time: ${new Date().toLocaleTimeString('en-US', { hour12: false })}
- Current timezone: UTC

Return ONLY a valid JSON object with these fields (only include fields that can be extracted from the input):
- title: string (required - the main task title)
- description: string (optional - additional details)
- priority: "low" | "medium" | "high" | "urgent" (optional - based on urgency keywords)
- tags: string[] (optional - relevant categories like "work", "personal", "health", etc.)
- dueDate: ISO string (optional - if a date/time is mentioned, always in UTC)
- reminderMinutes: number (optional - minutes before due date to remind, default 15 if reminder is mentioned)

DATE/TIME PARSING RULES:
- "today" = today's date
- "tomorrow" = today + 1 day
- "next Monday/Tuesday/etc" = next occurrence of that day
- "Friday at 3pm" = next Friday at 15:00
- If no time specified, default to 09:00 (9 AM)
- Always return dates in ISO format with UTC timezone

Examples:
Input: "Dentist appointment next Friday at 3pm"
Output: {"title": "Dentist appointment", "tags": ["health", "appointment"], "dueDate": "2024-12-27T15:00:00.000Z", "reminderMinutes": 15}

Input: "Submit report tomorrow by 5pm"
Output: {"title": "Submit report", "tags": ["work"], "dueDate": "2024-12-21T17:00:00.000Z", "reminderMinutes": 30}

Input: "Call mom this weekend"
Output: {"title": "Call mom", "tags": ["personal", "family"], "dueDate": "2024-12-22T09:00:00.000Z"}

Input: "Urgent: finish essay by Monday morning"
Output: {"title": "Finish essay", "priority": "urgent", "tags": ["school", "assignment"], "dueDate": "2024-12-23T09:00:00.000Z"}

Input: "Buy groceries today"
Output: {"title": "Buy groceries", "tags": ["personal", "shopping"], "dueDate": "2024-12-20T09:00:00.000Z"}

Return only the JSON object, no other text.`
          },
          { role: 'user', content: input }
        ],
        max_completion_tokens: 500,
      }),
    });

    console.log('OpenAI response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API request failed: ${response.status} - ${errorText}`);
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
