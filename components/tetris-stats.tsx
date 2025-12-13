"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Badge } from "@heroui/badge";

interface TetrisStatsProps {
  score: number;
  level: number;
  lines: number;
}

export function TetrisStats({ score, level, lines }: TetrisStatsProps) {
  return (
    <Card className="w-full md:w-64">
      <CardHeader>
        <h3 className="text-lg font-semibold">Statistics</h3>
      </CardHeader>
      <CardBody className="gap-3">
        <div className="flex justify-between items-center">
          <span className="text-default-600">Score</span>
          <Badge color="danger" size="lg" variant="flat">
            {score.toLocaleString()}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-600">Level</span>
          <Badge color="danger" size="lg" variant="flat">
            {level}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-600">Lines</span>
          <Badge color="danger" size="lg" variant="flat">
            {lines}
          </Badge>
        </div>
      </CardBody>
    </Card>
  );
}
