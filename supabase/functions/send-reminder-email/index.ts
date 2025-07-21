import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReminderEmailRequest {
  to: string;
  taskTitle: string;
  taskDescription?: string;
  dueDate: string;
  userEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Reminder email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, taskTitle, taskDescription, dueDate, userEmail }: ReminderEmailRequest = await req.json();
    
    console.log("Sending reminder email to:", to);
    console.log("Task:", taskTitle);

    const emailResponse = await resend.emails.send({
      from: "KirstysToDos <reminders@resend.dev>",
      to: [to],
      subject: `Reminder: ${taskTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #588157; border-bottom: 2px solid #588157; padding-bottom: 10px;">
            📋 Task Reminder
          </h1>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #3a5a40; margin-top: 0;">
              ${taskTitle}
            </h2>
            
            ${taskDescription ? `
              <p style="color: #6c757d; margin: 10px 0;">
                <strong>Description:</strong> ${taskDescription}
              </p>
            ` : ''}
            
            <p style="color: #6c757d; margin: 10px 0;">
              <strong>Due Date:</strong> ${new Date(dueDate).toLocaleString()}
            </p>
          </div>
          
          <p style="color: #6c757d;">
            This is a friendly reminder about your upcoming task in KirstysToDos.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 12px;">
            <p>Best regards,<br>KirstysToDos Team</p>
            <p>You're receiving this because you have email reminders enabled for your tasks.</p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reminder-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);