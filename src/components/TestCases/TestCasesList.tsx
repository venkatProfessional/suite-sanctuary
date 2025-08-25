import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Edit, Trash2, Eye, Tag, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { dataService } from '@/services/dataService';
import { TestCase, FilterOptions, SortOptions, Priority, TestCaseStatus } from '@/types';
import { TestCaseForm } from './TestCaseForm';
import { TestCaseDetail } from './TestCaseDetail';
import { ExportButton } from './ExportButton';

export const TestCasesList: React.FC = () => {
  const { toast } = useToast();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Filters and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TestCaseStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const pageSize = 10;

  const loadTestCases = async () => {
    try {
      setLoading(true);
      
      const filters: FilterOptions = {
        searchQuery: searchQuery || undefined,
        status: statusFilter !== 'all' ? [statusFilter] : undefined,
        priority: priorityFilter !== 'all' ? [priorityFilter] : undefined
      };

      const sort: SortOptions = { field: 'updatedAt', direction: 'desc' };
      const pagination = { page: currentPage, limit: pageSize };

      const result = dataService.searchTestCases(filters, sort, pagination);
      
      setTestCases(result.testCases);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      console.error('Error loading test cases:', error);
      toast({
        title: 'Error',
        description: 'Failed to load test cases',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestCases();
  }, [searchQuery, statusFilter, priorityFilter, currentPage]);

  const handleCreateTestCase = async (testCaseData: Partial<TestCase>) => {
    try {
      await dataService.saveTestCase(testCaseData);
      setIsCreateModalOpen(false);
      loadTestCases();
      toast({
        title: 'Success',
        description: 'Test case created successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create test case',
        variant: 'destructive'
      });
    }
  };

  const handleEditTestCase = async (testCaseData: Partial<TestCase>) => {
    try {
      await dataService.saveTestCase(testCaseData);
      setIsEditModalOpen(false);
      setSelectedTestCase(null);
      loadTestCases();
      toast({
        title: 'Success',
        description: 'Test case updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update test case',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTestCase = async (id: string) => {
    try {
      const success = dataService.deleteTestCase(id);
      if (success) {
        loadTestCases();
        toast({
          title: 'Success',
          description: 'Test case deleted successfully'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete test case',
        variant: 'destructive'
      });
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'High': return 'bg-priority-high/10 text-priority-high border-priority-high/20';
      case 'Medium': return 'bg-priority-medium/10 text-priority-medium border-priority-medium/20';
      case 'Low': return 'bg-priority-low/10 text-priority-low border-priority-low/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: TestCaseStatus) => {
    switch (status) {
      case 'Active': return 'bg-status-active/10 text-status-active border-status-active/20';
      case 'Draft': return 'bg-status-draft/10 text-status-draft border-status-draft/20';
      case 'Archived': return 'bg-status-archived/10 text-status-archived border-status-archived/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Test Cases</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize your test cases ({total} total)
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <ExportButton testCases={testCases} />
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Test Case
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Test Case</DialogTitle>
              </DialogHeader>
              <TestCaseForm onSubmit={handleCreateTestCase} onCancel={() => setIsCreateModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search test cases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TestCaseStatus | 'all')}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as Priority | 'all')}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Test Cases List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-1/4 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-3/4 mt-2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : testCases.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No test cases found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first test case'}
            </p>
            {!searchQuery && statusFilter === 'all' && priorityFilter === 'all' && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Test Case
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {testCases.map((testCase) => (
            <Card key={testCase.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-medium text-foreground mb-1">
                      {testCase.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      ID: {testCase.id} • Updated {formatDate(testCase.updatedAt)}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getPriorityColor(testCase.priority)}>
                      {testCase.priority}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(testCase.status)}>
                      {testCase.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {testCase.description}
                </p>
                
                {testCase.tags.length > 0 && (
                  <div className="flex items-center gap-1 mb-4">
                    <Tag className="w-3 h-3 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {testCase.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {testCase.steps.length} step(s) • Version {testCase.version}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTestCase(testCase);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTestCase(testCase);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTestCase(testCase.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  )}
                  
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (page === currentPage || Math.abs(page - currentPage) <= 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={page === currentPage}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Test Case</DialogTitle>
          </DialogHeader>
          {selectedTestCase && (
            <TestCaseForm 
              initialData={selectedTestCase}
              onSubmit={handleEditTestCase} 
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedTestCase(null);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test Case Details</DialogTitle>
          </DialogHeader>
          {selectedTestCase && (
            <TestCaseDetail 
              testCase={selectedTestCase}
              onClose={() => {
                setIsDetailModalOpen(false);
                setSelectedTestCase(null);
              }}
              onEdit={() => {
                setIsDetailModalOpen(false);
                setIsEditModalOpen(true);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};