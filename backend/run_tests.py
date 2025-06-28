#!/usr/bin/env python3
"""
Test runner script for the backend application.
"""
import os
import sys
import subprocess
import argparse

def run_tests(test_type=None, verbose=False, coverage=False):
    """Run tests with various options."""
    
    # Change to backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    # Base pytest command
    cmd = ['python', '-m', 'pytest']
    
    # Add verbosity
    if verbose:
        cmd.append('-v')
    
    # Add coverage
    if coverage:
        cmd.extend(['--cov=.', '--cov-report=html', '--cov-report=term'])
    
    # Add specific test type
    if test_type:
        if test_type == 'models':
            cmd.append('tests/test_models.py')
        elif test_type == 'auth':
            cmd.append('tests/test_auth_routes.py')
        elif test_type == 'stripe':
            cmd.append('tests/test_stripe_routes.py')
        else:
            print(f"Unknown test type: {test_type}")
            sys.exit(1)
    
    # Run the tests
    print(f"Running command: {' '.join(cmd)}")
    result = subprocess.run(cmd)
    
    if coverage and result.returncode == 0:
        print("\nCoverage report generated in htmlcov/index.html")
    
    return result.returncode

def main():
    parser = argparse.ArgumentParser(description='Run backend tests')
    parser.add_argument('--type', choices=['models', 'auth', 'stripe'], 
                       help='Run specific test type')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Verbose output')
    parser.add_argument('--coverage', '-c', action='store_true',
                       help='Generate coverage report')
    
    args = parser.parse_args()
    
    exit_code = run_tests(
        test_type=args.type,
        verbose=args.verbose,
        coverage=args.coverage
    )
    
    sys.exit(exit_code)

if __name__ == '__main__':
    main() 