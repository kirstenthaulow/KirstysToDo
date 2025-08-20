import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to extract a clean title from input
function extractCleanTitle(input: string): string {
  // Remove common filler words and clean up the input
  const fillerWords = ['urgent', 'asap', 'please', 'need to', 'have to', 'should', 'must', 'remember to'];
  let cleanInput = input.toLowerCase();
  
  fillerWords.forEach(word => {
    cleanInput = cleanInput.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  });
  
  // Take first 5-8 words and capitalize properly
  const words = cleanInput.trim().split(/\s+/).filter(word => word.length > 0);
  const titleWords = words.slice(0, Math.min(8, words.length));
  
  return titleWords
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim() || input.slice(0, 50); // Fallback to first 50 chars
}

// Helper function to get current date context
function getCurrentDateContext(): string {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Get next Monday
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7);
  if (nextMonday.getTime() <= now.getTime()) {
    nextMonday.setDate(nextMonday.getDate() + 7);
  }
  
  return `
CURRENT CONTEXT:
- Today's date: ${today}
- Tomorrow's date: ${tomorrow}
- Current time: ${now.toLocaleTimeString('en-US', { hour12: false })}
- Next Monday: ${nextMonday.toISOString().split('T')[0]}
- Current timezone: UTC`;
}

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

    console.log('Processing input:', input);
    
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

${getCurrentDateContext()}

CRITICAL INSTRUCTIONS:
- Return ONLY valid JSON, no other text
- title should be CONCISE (2-8 words max), not the entire input
- Extract the core action/task, remove filler words
- If input is long, summarize the main task for the title

Return a JSON object with these fields (only include fields that can be extracted):
- title: string (required - concise task name, NOT the full input)
- description: string (optional - additional details from input)
- priority: "low" | "medium" | "high" | "urgent" (optional - based on urgency keywords)
- tags: string[] (optional - relevant categories like "work", "personal", "health", etc.)
- dueDate: ISO string (optional - if date/time mentioned, use current context above)
- reminderMinutes: number (optional - minutes before due date, default 15 if reminder mentioned)

DATE/TIME PARSING RULES (use current context above):
- "today" = today's date from context
- "tomorrow" = tomorrow's date from context  
- "next Monday/Tuesday/etc" = next occurrence using context
- "Friday at 3pm" = next Friday at 15:00
- If no time specified, default to 09:00 (9 AM)
- Always return dates in ISO format with UTC timezone

EXAMPLES WITH PROPER TITLES:
Input: "Dentist appointment next Friday at 3pm"
Output: {"title": "Dentist Appointment", "description": "Scheduled for next Friday", "tags": ["health", "appointment"], "dueDate": "2025-01-24T15:00:00.000Z", "reminderMinutes": 15}

Input: "I need to submit the quarterly report tomorrow by 5pm for my boss"
Output: {"title": "Submit Quarterly Report", "description": "For boss, due by 5pm", "tags": ["work"], "dueDate": "2025-01-21T17:00:00.000Z", "reminderMinutes": 30}

Input: "Call mom this weekend to discuss holiday plans"
Output: {"title": "Call Mom", "description": "Discuss holiday plans", "tags": ["personal", "family"], "dueDate": "2025-01-25T09:00:00.000Z"}

Input: "Urgent: finish essay by Monday morning for English class"
Output: {"title": "Finish Essay", "description": "For English class", "priority": "urgent", "tags": ["school", "assignment"], "dueDate": "2025-01-27T09:00:00.000Z"}

Input: "Buy groceries today - need milk, bread, and eggs"
Output: {"title": "Buy Groceries", "description": "Need milk, bread, and eggs", "tags": ["personal", "shopping"], "dueDate": "2025-01-20T09:00:00.000Z"}

Return only the JSON object, no markdown or other formatting.`
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
    console.log('OpenAI raw response:', JSON.stringify(data, null, 2));
    
    let parsedTask;
    const rawContent = data.choices[0].message.content;
    console.log('OpenAI content to parse:', rawContent);
    
    try {
      // Clean up the response - remove markdown formatting if present
      const cleanContent = rawContent.replace(/^```json\s*|\s*```$/g, '').trim();
      parsedTask = JSON.parse(cleanContent);
      
      // Validate the parsed response
      if (!parsedTask.title || typeof parsedTask.title !== 'string') {
        throw new Error('Invalid or missing title');
      }
      
      // Ensure title is reasonable length
      if (parsedTask.title.length > 100) {
        parsedTask.title = parsedTask.title.slice(0, 100) + '...';
      }
      
      // Validate other fields
      if (parsedTask.dueDate && !Date.parse(parsedTask.dueDate)) {
        console.warn('Invalid date format, removing dueDate:', parsedTask.dueDate);
        delete parsedTask.dueDate;
      }
      
      if (parsedTask.tags && !Array.isArray(parsedTask.tags)) {
        console.warn('Invalid tags format, removing tags:', parsedTask.tags);
        delete parsedTask.tags;
      }
      
      console.log('Successfully parsed task:', JSON.stringify(parsedTask, null, 2));
      
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('Raw content was:', rawContent);
      
      // Intelligent fallback - extract a clean title and use the input as description
      const cleanTitle = extractCleanTitle(input);
      
      parsedTask = {
        title: cleanTitle,
        description: input.length > cleanTitle.length + 20 ? input : undefined
      };
      
      console.log('Using fallback parsed task:', JSON.stringify(parsedTask, null, 2));
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
