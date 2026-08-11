import React from 'react';
import { Clock, Trophy, BarChart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Quiz } from '@/types/quiz';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuizCardProps {
  quiz: Quiz;
}

export const QuizCard: React.FC<QuizCardProps> = ({ quiz }) => {
  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="aspect-video w-full bg-muted overflow-hidden rounded-t-lg">
        {quiz.thumbnail_path ? (
          <img
            src={`http://localhost:8000/${quiz.thumbnail_path}`}
            alt={quiz.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-primary/5">
            <Trophy size={48} className="opacity-20" />
          </div>
        )}
      </div>
      <CardHeader className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
            quiz.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
            quiz.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {quiz.difficulty}
          </span>
          <span className="text-xs text-muted-foreground font-medium">v{quiz.version}</span>
        </div>
        <CardTitle className="line-clamp-1">{quiz.title}</CardTitle>
        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
          {quiz.description || "No description available."}
        </CardDescription>
      </CardHeader>
      <CardContent className="py-0">
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            {quiz.duration_minutes}m
          </div>
          <div className="flex items-center">
            <BarChart className="mr-2 h-4 w-4" />
            {quiz.passing_percentage}% pass
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-6">
        <Link to={`/quizzes/${quiz.id}`} className="w-full">
          <Button variant="primary" className="w-full group">
            View Quiz
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
