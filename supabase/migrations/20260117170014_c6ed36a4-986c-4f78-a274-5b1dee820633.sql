-- Fix profiles INSERT policy to allow admins to create profiles for new monitors
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;

-- Allow users to insert their own profile OR admins to insert any profile
CREATE POLICY "Users or admins can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Also allow admins to INSERT into user_roles for new monitors
DROP POLICY IF EXISTS "Admins podem gerenciar roles" ON public.user_roles;

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));