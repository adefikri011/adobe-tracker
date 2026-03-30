import { createClient } from "./client";

export async function fetchAllUsers() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*");
  
  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  
  return data;
}