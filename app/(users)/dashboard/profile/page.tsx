export const metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-2 text-muted-foreground">
        View and update your profile information.
      </p>
      <div className="mt-8 luxury-card text-center py-12">
        <p className="text-muted-foreground">Profile settings coming soon.</p>
      </div>
    </div>
  );
}
