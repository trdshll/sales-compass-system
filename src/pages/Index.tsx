
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart3, ChevronRight, PieChart, Users } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
      <header className="container mx-auto py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-primary">Sales Compass</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link to="/signup">
            <Button>Sign up</Button>
          </Link>
        </div>
      </header>
      
      <main>
        <section className="py-20">
          <div className="container mx-auto text-center">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              Manage Your Sales With Ease
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-3xl mx-auto">
              Sales Compass is a comprehensive sales management system that helps you track sales, analyze performance, and grow your business.
            </p>
            <div className="mt-10 flex items-center justify-center gap-6">
              <Link to="/signup">
                <Button size="lg" className="gap-2">
                  Get Started
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Log in
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        <section className="py-20 bg-secondary">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Everything You Need to Manage Sales
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background p-8 rounded-lg shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Sales Tracking</h3>
                <p className="text-muted-foreground">
                  Record and track all your sales transactions in one place. View sales history, filter records, and export data.
                </p>
              </div>
              
              <div className="bg-background p-8 rounded-lg shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <PieChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Analytics</h3>
                <p className="text-muted-foreground">
                  Gain insights with powerful analytics and reporting. Track performance metrics and identify growth opportunities.
                </p>
              </div>
              
              <div className="bg-background p-8 rounded-lg shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Customer Management</h3>
                <p className="text-muted-foreground">
                  Maintain a comprehensive database of customers. View purchase history and manage relationships.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-20">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to take control of your sales?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Sign up today and start managing your sales more effectively.
            </p>
            <Link to="/signup">
              <Button size="lg">Create an Account</Button>
            </Link>
          </div>
        </section>
      </main>
      
      <footer className="py-12 bg-muted">
        <div className="container mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary mb-2">Sales Compass</h2>
            <p className="text-muted-foreground">Modern sales management system</p>
            <p className="text-sm text-muted-foreground mt-8">
              © {new Date().getFullYear()} Sales Compass. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
