import React from 'react';
import { Title, Text } from '@mantine/core';
import Card from '../../components/Card';
import ExternalLink from '../../components/ExternalLink';

interface Props {
  children: React.ReactNode,
}

interface State {
  hasError: boolean,
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
    }
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // TODO: log to reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <Title>Oh no...</Title>
          <Text>
            Something broke horribly... Sorry about that, but that's why it says BETA at the top :P<br />
            If you don't mind, you can <ExternalLink href='https://github.com/lydianlights/yet-another-factory-planner/issues'>file an issue on github</ExternalLink> or <ExternalLink href='https://discord.gg/p7e9ZzRHCm'>contact me on discord</ExternalLink> letting me know what you were doing, that way I can fix this crash.<br />
            In the meantime, refreshing the page should reset everything and let you get back to work :D
          </Text>
        </Card>
      )
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
