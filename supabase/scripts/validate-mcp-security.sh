#!/bin/bash
# Kitchen Pantry CRM - MCP Security Validation Script
# This script validates that MCP is properly configured for development-only access

set -e

echo "🔒 Validating MCP Security Configuration"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

VALIDATION_PASSED=true

# Check if we're in development environment
check_environment() {
    echo "🔍 Checking environment configuration..."
    
    if [[ "$NODE_ENV" == "production" ]]; then
        echo -e "${RED}❌ ERROR: MCP cannot be used in production environment${NC}"
        VALIDATION_PASSED=false
    elif [[ "$MCP_ENVIRONMENT" != "development" ]]; then
        echo -e "${YELLOW}⚠️  WARNING: MCP_ENVIRONMENT is not set to 'development'${NC}"
    else
        echo -e "${GREEN}✅ Environment check passed${NC}"
    fi
}

# Check database connection settings
check_database_connection() {
    echo "🔍 Checking database connection settings..."
    
    # Check if using local database
    if [[ "$DATABASE_URL" == *"127.0.0.1"* ]] || [[ "$DATABASE_URL" == *"localhost"* ]]; then
        echo -e "${GREEN}✅ Using local database${NC}"
    elif [[ "$DATABASE_URL" == *"supabase.co"* ]]; then
        echo -e "${RED}❌ ERROR: Attempting to connect to production Supabase instance${NC}"
        VALIDATION_PASSED=false
    else
        echo -e "${YELLOW}⚠️  WARNING: Unknown database connection${NC}"
    fi
    
    # Check port configuration
    if [[ "$DATABASE_URL" == *":54322"* ]]; then
        echo -e "${GREEN}✅ Using correct local database port${NC}"
    else
        echo -e "${YELLOW}⚠️  WARNING: Not using standard local database port${NC}"
    fi
}

# Check Supabase configuration
check_supabase_config() {
    echo "🔍 Checking Supabase configuration..."
    
    if [[ -f "supabase/config.toml" ]]; then
        # Check API URL
        API_URL=$(grep -o 'api_url = ".*"' supabase/config.toml | cut -d'"' -f2)
        if [[ "$API_URL" == *"127.0.0.1"* ]] || [[ "$API_URL" == *"localhost"* ]]; then
            echo -e "${GREEN}✅ Supabase API URL is local${NC}"
        else
            echo -e "${RED}❌ ERROR: Supabase API URL is not local${NC}"
            VALIDATION_PASSED=false
        fi
        
        # Check project ID
        PROJECT_ID=$(grep -o 'project_id = ".*"' supabase/config.toml | cut -d'"' -f2)
        if [[ "$PROJECT_ID" == "KitchenPantry" ]]; then
            echo -e "${GREEN}✅ Using development project ID${NC}"
        else
            echo -e "${YELLOW}⚠️  WARNING: Unexpected project ID: $PROJECT_ID${NC}"
        fi
    else
        echo -e "${RED}❌ ERROR: Supabase config file not found${NC}"
        VALIDATION_PASSED=false
    fi
}

# Check MCP security configuration
check_mcp_security() {
    echo "🔍 Checking MCP security configuration..."
    
    if [[ -f "supabase/mcp-security.json" ]]; then
        # Check if jq is available
        if command -v jq &> /dev/null; then
            SECURITY_PROFILE=$(jq -r '.security_profile' supabase/mcp-security.json)
            if [[ "$SECURITY_PROFILE" == "development_only" ]]; then
                echo -e "${GREEN}✅ MCP security profile is development_only${NC}"
            else
                echo -e "${RED}❌ ERROR: MCP security profile is not development_only${NC}"
                VALIDATION_PASSED=false
            fi
            
            # Check production access
            PRODUCTION_ACCESS=$(jq -r '.access_controls.operation_permissions.restricted_operations.production_access' supabase/mcp-security.json)
            if [[ "$PRODUCTION_ACCESS" == "false" ]]; then
                echo -e "${GREEN}✅ Production access is disabled${NC}"
            else
                echo -e "${RED}❌ ERROR: Production access is enabled${NC}"
                VALIDATION_PASSED=false
            fi
        else
            echo -e "${YELLOW}⚠️  WARNING: jq not available, cannot validate MCP security JSON${NC}"
        fi
    else
        echo -e "${RED}❌ ERROR: MCP security configuration file not found${NC}"
        VALIDATION_PASSED=false
    fi
}

# Check network restrictions
check_network_restrictions() {
    echo "🔍 Checking network restrictions..."
    
    # Check if we can connect to local database
    if command -v pg_isready &> /dev/null; then
        if pg_isready -h 127.0.0.1 -p 54322 &> /dev/null; then
            echo -e "${GREEN}✅ Local database is accessible${NC}"
        else
            echo -e "${YELLOW}⚠️  WARNING: Local database is not accessible${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  WARNING: pg_isready not available, cannot test database connection${NC}"
    fi
}

# Check for production environment variables
check_production_vars() {
    echo "🔍 Checking for production environment variables..."
    
    if [[ -n "$SUPABASE_URL" ]] && [[ "$SUPABASE_URL" == *"supabase.co"* ]]; then
        echo -e "${RED}❌ ERROR: Production Supabase URL detected${NC}"
        VALIDATION_PASSED=false
    elif [[ -n "$SUPABASE_URL" ]] && [[ "$SUPABASE_URL" == *"127.0.0.1"* ]]; then
        echo -e "${GREEN}✅ Using local Supabase URL${NC}"
    fi
    
    if [[ -n "$SUPABASE_SERVICE_ROLE_KEY" ]] && [[ ${#SUPABASE_SERVICE_ROLE_KEY} -gt 200 ]]; then
        echo -e "${YELLOW}⚠️  WARNING: Service role key detected (ensure it's for local development)${NC}"
    fi
}

# Main validation function
main() {
    echo "Starting MCP security validation for Kitchen Pantry CRM..."
    echo "Environment: ${MCP_ENVIRONMENT:-"not set"}"
    echo "Database URL: ${DATABASE_URL:-"not set"}"
    echo ""
    
    check_environment
    check_database_connection
    check_supabase_config
    check_mcp_security
    check_network_restrictions
    check_production_vars
    
    echo ""
    echo "======================================="
    
    if [[ "$VALIDATION_PASSED" == true ]]; then
        echo -e "${GREEN}✅ MCP Security Validation PASSED${NC}"
        echo "MCP is properly configured for development-only access."
        exit 0
    else
        echo -e "${RED}❌ MCP Security Validation FAILED${NC}"
        echo "Please address the security issues above before using MCP."
        exit 1
    fi
}

# Run main function
main