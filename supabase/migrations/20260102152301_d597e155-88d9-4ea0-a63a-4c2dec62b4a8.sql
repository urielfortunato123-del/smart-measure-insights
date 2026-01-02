-- Add missing RLS policy for user_analytics: users can view their own analytics
CREATE POLICY "Users can view their own analytics" 
ON public.user_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add missing RLS policy for profiles: users can delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id);

-- Add missing RLS policy for item_history: users can update their own history
CREATE POLICY "Users can update their own history" 
ON public.item_history 
FOR UPDATE 
USING (auth.uid() = user_id);